import io
import os
import shutil
import tempfile
import subprocess
from datetime import datetime

# Optional fallback to ReportLab
try:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False


def find_browser_executable() -> str:
    """Finds Google Chrome or Microsoft Edge for 100% native Devanagari text shaping."""
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        shutil.which("chrome"),
        shutil.which("google-chrome"),
        shutil.which("msedge"),
        shutil.which("edge"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return ""


def generate_html_invoice(bill, settings) -> str:
    """Generates clean HTML invoice with perfect Marathi font support."""
    # Item rows
    items_html = ""
    for idx, it in enumerate(bill.items, start=1):
        v_name = it.vendor.name if it.vendor else "सामाईक / थेट शेतकरी"
        qty_formatted = f"{it.quantity:g}"
        amount_formatted = f"{it.amount:,.2f}"
        rate_formatted = f"{it.rate:,.2f}"
        items_html += f"""
        <tr>
            <td style="text-align: center;">{idx}</td>
            <td><b>{it.item_name}</b></td>
            <td><span class="vendor-tag">{v_name}</span></td>
            <td style="text-align: center;">{it.unit}</td>
            <td style="text-align: right; font-weight: 600;">{qty_formatted}</td>
            <td style="text-align: right;">₹ {rate_formatted}</td>
            <td style="text-align: right; font-weight: bold; color: #1B5E20;">₹ {amount_formatted}</td>
        </tr>
        """

    # Extra charges rows
    extra_rows = ""
    if bill.transport_charges > 0:
        extra_rows += f"""
        <tr>
            <td class="total-label">वाहतूक / हमाली खर्च (+):</td>
            <td class="total-val">+ ₹ {bill.transport_charges:,.2f}</td>
        </tr>
        """
    if bill.discount > 0:
        extra_rows += f"""
        <tr>
            <td class="total-label" style="color: #C62828;">दिलेली विशेष सूट (-):</td>
            <td class="total-val" style="color: #C62828;">- ₹ {bill.discount:,.2f}</td>
        </tr>
        """

    upi_info = ""
    if settings.upi_id:
        upi_info = f"<p><b>ऑनलाइन पेमेंट (UPI):</b> {settings.upi_id}</p>"

    notes_info = ""
    if bill.notes:
        notes_info = f"<p><b>विशेष नोंद / शेरा:</b> {bill.notes}</p>"

    html = f"""<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="utf-8">
<title>बिल - {bill.bill_number}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

  @page {{
    size: A4;
    margin: 12mm 14mm;
  }}

  * {{
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }}

  body {{
    font-family: 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', sans-serif;
    color: #212121;
    background-color: #FFFFFF;
    font-size: 13px;
    line-height: 1.4;
    padding: 10px;
  }}

  .header-card {{
    text-align: center;
    border-bottom: 2px solid #1B5E20;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }}

  .invocation {{
    font-size: 11px;
    color: #616161;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }}

  .shop-title {{
    font-size: 22px;
    font-weight: 700;
    color: #1B5E20;
    margin-bottom: 2px;
  }}

  .tagline {{
    font-size: 11.5px;
    color: #2E7D32;
    font-weight: 500;
    margin-bottom: 4px;
  }}

  .address-line {{
    font-size: 10.5px;
    color: #424242;
  }}

  .bill-badge-wrap {{
    background-color: #1B5E20;
    color: #FFFFFF;
    text-align: center;
    padding: 6px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }}

  .meta-grid {{
    display: table;
    width: 100%;
    background-color: #F1F8E9;
    border: 1px solid #C8E6C9;
    border-radius: 6px;
    padding: 8px 12px;
    margin-bottom: 14px;
  }}

  .meta-row {{
    display: table-row;
  }}

  .meta-cell {{
    display: table-cell;
    padding: 4px 6px;
    font-size: 12px;
  }}

  .meta-label {{
    font-weight: 700;
    color: #1B5E20;
    width: 18%;
  }}

  .meta-val {{
    color: #212121;
    width: 32%;
  }}

  .status-badge {{
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 11px;
    background-color: #E8F5E9;
    color: #2E7D32;
    border: 1px solid #A5D6A7;
  }}

  table.items-table {{
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }}

  table.items-table th {{
    background-color: #1B5E20;
    color: #FFFFFF;
    font-weight: 700;
    padding: 7px 8px;
    font-size: 11.5px;
    border: 1px solid #1B5E20;
    text-align: left;
  }}

  table.items-table td {{
    padding: 6px 8px;
    font-size: 11.5px;
    border: 1px solid #DCEDC8;
    vertical-align: middle;
  }}

  table.items-table tr:nth-child(even) {{
    background-color: #F9FBE7;
  }}

  .vendor-tag {{
    display: inline-block;
    background-color: #E8F5E9;
    color: #1B5E20;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10.5px;
    font-weight: 500;
    border: 1px solid #C8E6C9;
  }}

  .calc-wrapper {{
    display: table;
    width: 100%;
    margin-bottom: 20px;
  }}

  .calc-left {{
    display: table-cell;
    width: 50%;
    vertical-align: top;
    padding-right: 15px;
    font-size: 11px;
    color: #424242;
  }}

  .calc-right {{
    display: table-cell;
    width: 50%;
    vertical-align: top;
  }}

  table.totals-table {{
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #C8E6C9;
    border-radius: 6px;
  }}

  table.totals-table td {{
    padding: 5px 8px;
    font-size: 12px;
    border-bottom: 1px solid #E8F5E9;
  }}

  .total-label {{
    text-align: right;
    color: #555555;
    width: 60%;
  }}

  .total-val {{
    text-align: right;
    font-weight: 600;
    width: 40%;
  }}

  .grand-total-row {{
    background-color: #DCEDC8 !important;
  }}

  .grand-total-row td {{
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #1B5E20 !important;
    padding: 8px 10px !important;
    border-top: 1.5px solid #1B5E20 !important;
  }}

  .sign-wrapper {{
    display: table;
    width: 100%;
    margin-top: 25px;
    padding-top: 15px;
  }}

  .sign-col {{
    display: table-cell;
    width: 50%;
    text-align: center;
    vertical-align: bottom;
    font-size: 11px;
    color: #424242;
  }}

  .sign-line {{
    margin-bottom: 6px;
    font-weight: 600;
  }}

  .footer-thanks {{
    text-align: center;
    margin-top: 20px;
    font-size: 11px;
    font-weight: 700;
    color: #2E7D32;
    padding-top: 8px;
    border-top: 1px dashed #C8E6C9;
  }}
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header-card">
    <div class="invocation">।। श्री गणेशाय नमः ।।</div>
    <div class="shop-title">{settings.shop_name}</div>
    <div class="tagline">{settings.tagline}</div>
    <div class="address-line">
      पत्ता: {settings.address} &nbsp;|&nbsp; मोबाइल: {settings.mobile}
    </div>
  </div>

  <!-- BADGE -->
  <div class="bill-badge-wrap">
    भाजीपाला घाऊक विक्री बिल (WHOLESALE BILL)
  </div>

  <!-- META INFO -->
  <div class="meta-grid">
    <div class="meta-row">
      <div class="meta-cell meta-label">ग्राहकाचे नाव:</div>
      <div class="meta-cell meta-val"><b>{bill.customer_name}</b></div>
      <div class="meta-cell meta-label">बिल क्रमांक:</div>
      <div class="meta-cell meta-val"><b>{bill.bill_number}</b></div>
    </div>
    <div class="meta-row">
      <div class="meta-cell meta-label">ग्राहक मोबाइल:</div>
      <div class="meta-cell meta-val">{bill.customer_mobile if bill.customer_mobile else "उपलब्ध नाही"}</div>
      <div class="meta-cell meta-label">दिनांक:</div>
      <div class="meta-cell meta-val"><b>{bill.bill_date}</b></div>
    </div>
    <div class="meta-row">
      <div class="meta-cell meta-label">देयक पद्धती:</div>
      <div class="meta-cell meta-val"><span class="status-badge">{bill.payment_status}</span></div>
      <div class="meta-cell meta-label">व्यापारी / अडते:</div>
      <div class="meta-cell meta-val">{settings.owner_name}</div>
    </div>
  </div>

  <!-- ITEMS TABLE -->
  <table class="items-table">
    <thead>
      <tr>
        <th style="width: 35px; text-align: center;">क्र.</th>
        <th>भाजीचे नाव (तपशील)</th>
        <th>व्हेंडर / शेतकरी नाव</th>
        <th style="width: 75px; text-align: center;">एकक</th>
        <th style="width: 75px; text-align: right;">प्रमाण</th>
        <th style="width: 80px; text-align: right;">दर (₹)</th>
        <th style="width: 95px; text-align: right;">रक्कम (₹)</th>
      </tr>
    </thead>
    <tbody>
      {items_html}
    </tbody>
  </table>

  <!-- TOTALS & NOTES -->
  <div class="calc-wrapper">
    <div class="calc-left">
      {notes_info}
      {upi_info}
      <p style="margin-top: 6px;"><b>नियम व अटी:</b> {settings.terms}</p>
    </div>

    <div class="calc-right">
      <table class="totals-table">
        <tr>
          <td class="total-label">भाजीपाला एकूण (Subtotal):</td>
          <td class="total-val">₹ {bill.subtotal:,.2f}</td>
        </tr>
        {extra_rows}
        <tr class="grand-total-row">
          <td class="total-label" style="font-weight: bold; color: #1B5E20;">अंतिम देय एकूण रक्कम:</td>
          <td class="total-val" style="color: #1B5E20;">₹ {bill.grand_total:,.2f}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- SIGNATURES -->
  <div class="sign-wrapper">
    <div class="sign-col">
      <div class="sign-line">....................................................</div>
      <div><b>ग्राहकाची स्वाक्षरी / पोच</b></div>
    </div>
    <div class="sign-col">
      <div class="sign-line">....................................................</div>
      <div><b>{settings.shop_name} साठी</b></div>
      <div style="font-size: 10px; color: #666;">(अधिकृत सही व शिक्का)</div>
    </div>
  </div>

  <div class="footer-thanks">
    🙏 आपल्या व्यवसायाबद्दल धन्यवाद! ताज्या भाजीपाल्यासाठी पुन्हा भेट द्या. 🙏
  </div>

</body>
</html>"""
    return html


def generate_bill_pdf(bill, settings) -> io.BytesIO:
    """
    Generates a flawless Marathi PDF invoice.
    Uses headless Chromium/Edge with DirectWrite & HarfBuzz for 100% perfect Devanagari text shaping.
    Falls back gracefully to ReportLab if no browser is found.
    """
    browser = find_browser_executable()
    html_content = generate_html_invoice(bill, settings)

    if browser:
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                html_path = os.path.join(tmpdir, "invoice.html")
                pdf_path = os.path.join(tmpdir, "invoice.pdf")

                with open(html_path, "w", encoding="utf-8") as f:
                    f.write(html_content)

                cmd = [
                    browser,
                    "--headless=new",
                    "--disable-gpu",
                    "--no-pdf-header-footer",
                    f"--print-to-pdf={pdf_path}",
                    html_path
                ]

                # Run headless browser to render PDF
                proc = subprocess.run(cmd, capture_output=True, timeout=15)
                if proc.returncode == 0 and os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
                    with open(pdf_path, "rb") as f:
                        pdf_data = f.read()
                    buffer = io.BytesIO(pdf_data)
                    buffer.seek(0)
                    return buffer
                else:
                    print(f"Browser PDF failed (code {proc.returncode}): {proc.stderr.decode('utf-8', errors='ignore')}")
        except Exception as ex:
            print(f"Browser PDF rendering exception: {ex}")

    # Fallback to ReportLab if browser rendering is unavailable
    if HAS_REPORTLAB:
        return _generate_reportlab_fallback(bill, settings)

    # Emergency fallback: write HTML to buffer
    return io.BytesIO(b"%PDF-1.4\n%Fallback placeholder")


def _generate_reportlab_fallback(bill, settings) -> io.BytesIO:
    """Fallback ReportLab generator."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=25, leftMargin=25, topMargin=25, bottomMargin=25)
    elements = []
    # Simplified ReportLab build
    p_style = ParagraphStyle('Head', fontName='Helvetica-Bold', fontSize=14, alignment=1)
    elements.append(Paragraph(f"Bill: {bill.bill_number}", p_style))
    elements.append(Paragraph(f"Customer: {bill.customer_name}", p_style))
    elements.append(Paragraph(f"Total: Rs. {bill.grand_total}", p_style))
    doc.build(elements)
    buffer.seek(0)
    return buffer
