import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

/**
 * Generates an elegant, printable A4 HTML invoice formatted for Marathi vegetable wholesale billing.
 * Renders with 100% native Devanagari text shaping in Android WebKit / Print Preview.
 */
export const generateBillHtml = (bill, settings = {}) => {
  const shopName = settings.shop_name || "श्री गणेश व्हेजिटेबल ट्रेडर्स";
  const tagline = settings.tagline || "घाऊक भाजीपाला व कांदा-बटाटा कमिशन एजंट";
  const address = settings.address || "मार्केट यार्ड, मुख्य भाजीपाला गाळा क्र. १२, पुणे";
  const mobile = settings.mobile || "९८७६५४३२१०";
  const ownerName = settings.owner_name || "गणेश शिंदे";
  const upiId = settings.upi_id || "ganesh@upi";
  const terms = settings.terms || "१) मालाची खात्री करूनच माल ताब्यात घ्यावा. २) नंतर कोणतीही तक्रार चालणार नाही.";

  // Format Items rows
  const itemsHtml = (bill.items || [])
    .map((it, idx) => {
      const vName = it.vendor_name || (it.vendor ? it.vendor.name : "सामाईक / थेट शेतकरी");
      const qty = Number(it.quantity || 0);
      const rate = Number(it.rate || 0);
      const amount = Number(it.amount || 0);
      return `
        <tr>
          <td style="text-align: center; font-weight: 600;">${idx + 1}</td>
          <td><b>${it.item_name || "-"}</b></td>
          <td><span class="vendor-tag">${vName}</span></td>
          <td style="text-align: center;">${it.unit || "किलो"}</td>
          <td style="text-align: right; font-weight: 600;">${qty}</td>
          <td style="text-align: right;">₹ ${rate.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td style="text-align: right; font-weight: bold; color: #1B5E20;">₹ ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>
      `;
    })
    .join("");

  // Extra rows (Transport & Discount)
  let extraRows = "";
  if (bill.transport_charges && Number(bill.transport_charges) > 0) {
    extraRows += `
      <tr>
        <td class="total-label">वाहतूक / हमाली खर्च (+):</td>
        <td class="total-val">+ ₹ ${Number(bill.transport_charges).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }
  if (bill.discount && Number(bill.discount) > 0) {
    extraRows += `
      <tr>
        <td class="total-label" style="color: #C62828;">दिलेली विशेष सूट (-):</td>
        <td class="total-val" style="color: #C62828;">- ₹ ${Number(bill.discount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    `;
  }

  const subtotalFormatted = Number(bill.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const grandTotalFormatted = Number(bill.grand_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>बिल - ${bill.bill_number || "Bill"}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700&display=swap');

  @page {
    size: A4;
    margin: 10mm 12mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Noto Sans Devanagari', 'Nirmala UI', 'Mangal', -apple-system, sans-serif;
    color: #212121;
    background-color: #FFFFFF;
    font-size: 13px;
    line-height: 1.4;
    padding: 12px;
  }

  .header-card {
    text-align: center;
    border-bottom: 2px solid #1B5E20;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }

  .invocation {
    font-size: 11px;
    color: #616161;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  .shop-title {
    font-size: 22px;
    font-weight: 700;
    color: #1B5E20;
    margin-bottom: 2px;
  }

  .tagline {
    font-size: 11.5px;
    color: #2E7D32;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .address-line {
    font-size: 10.5px;
    color: #424242;
  }

  .bill-badge-wrap {
    background-color: #1B5E20;
    color: #FFFFFF;
    text-align: center;
    padding: 6px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.5px;
    margin-bottom: 10px;
  }

  .meta-grid {
    display: table;
    width: 100%;
    background-color: #F1F8E9;
    border: 1px solid #C8E6C9;
    border-radius: 6px;
    padding: 8px 10px;
    margin-bottom: 12px;
  }

  .meta-row {
    display: table-row;
  }

  .meta-cell {
    display: table-cell;
    padding: 4px 6px;
    font-size: 12px;
  }

  .meta-label {
    font-weight: 700;
    color: #1B5E20;
    width: 18%;
  }

  .meta-val {
    color: #212121;
    width: 32%;
  }

  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 11px;
    background-color: ${bill.payment_status === "रोख" ? "#E8F5E9" : bill.payment_status === "उधारी" ? "#FFEBEE" : "#E3F2FD"};
    color: ${bill.payment_status === "रोख" ? "#2E7D32" : bill.payment_status === "उधारी" ? "#C62828" : "#1565C0"};
    border: 1px solid ${bill.payment_status === "रोख" ? "#A5D6A7" : bill.payment_status === "उधारी" ? "#FFCDD2" : "#90CAF9"};
  }

  table.items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
  }

  table.items-table th {
    background-color: #1B5E20;
    color: #FFFFFF;
    font-weight: 700;
    padding: 7px 8px;
    font-size: 11.5px;
    border: 1px solid #1B5E20;
    text-align: left;
  }

  table.items-table td {
    padding: 6px 8px;
    font-size: 11.5px;
    border: 1px solid #DCEDC8;
    vertical-align: middle;
  }

  table.items-table tr:nth-child(even) {
    background-color: #F9FBE7;
  }

  .vendor-tag {
    display: inline-block;
    background-color: #E8F5E9;
    color: #1B5E20;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10.5px;
    font-weight: 500;
    border: 1px solid #C8E6C9;
  }

  .calc-wrapper {
    display: table;
    width: 100%;
    margin-bottom: 16px;
  }

  .calc-left {
    display: table-cell;
    width: 48%;
    vertical-align: top;
    padding-right: 12px;
    font-size: 11px;
    color: #424242;
  }

  .calc-right {
    display: table-cell;
    width: 52%;
    vertical-align: top;
  }

  table.totals-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #C8E6C9;
    border-radius: 6px;
  }

  table.totals-table td {
    padding: 5px 8px;
    font-size: 12px;
    border-bottom: 1px solid #E8F5E9;
  }

  .total-label {
    text-align: right;
    color: #555555;
    width: 60%;
  }

  .total-val {
    text-align: right;
    font-weight: 600;
    width: 40%;
  }

  .grand-total-row {
    background-color: #DCEDC8 !important;
  }

  .grand-total-row td {
    font-size: 13.5px !important;
    font-weight: 700 !important;
    color: #1B5E20 !important;
    padding: 8px 10px !important;
    border-top: 1.5px solid #1B5E20 !important;
  }

  .sign-wrapper {
    display: table;
    width: 100%;
    margin-top: 20px;
    padding-top: 10px;
  }

  .sign-col {
    display: table-cell;
    width: 50%;
    text-align: center;
    vertical-align: bottom;
    font-size: 11px;
    color: #424242;
  }

  .sign-line {
    margin-bottom: 6px;
    font-weight: 600;
  }

  .footer-thanks {
    text-align: center;
    margin-top: 16px;
    font-size: 11px;
    font-weight: 700;
    color: #2E7D32;
    padding-top: 8px;
    border-top: 1px dashed #C8E6C9;
  }
</style>
</head>
<body>

  <!-- HEADER -->
  <div class="header-card">
    <div class="invocation">।। श्री गणेशाय नमः ।।</div>
    <div class="shop-title">${shopName}</div>
    <div class="tagline">${tagline}</div>
    <div class="address-line">
      पत्ता: ${address} &nbsp;|&nbsp; मोबाइल: ${mobile}
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
      <div class="meta-cell meta-val"><b>${bill.customer_name || "रोख ग्राहक"}</b></div>
      <div class="meta-cell meta-label">बिल क्रमांक:</div>
      <div class="meta-cell meta-val"><b>${bill.bill_number || "-"}</b></div>
    </div>
    <div class="meta-row">
      <div class="meta-cell meta-label">ग्राहक मोबाइल:</div>
      <div class="meta-cell meta-val">${bill.customer_mobile || "उपलब्ध नाही"}</div>
      <div class="meta-cell meta-label">दिनांक:</div>
      <div class="meta-cell meta-val"><b>${bill.bill_date || "-"}</b></div>
    </div>
    <div class="meta-row">
      <div class="meta-cell meta-label">देयक पद्धती:</div>
      <div class="meta-cell meta-val"><span class="status-badge">${bill.payment_status || "रोख"}</span></div>
      <div class="meta-cell meta-label">व्यापारी / अडते:</div>
      <div class="meta-cell meta-val">${ownerName}</div>
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
      ${itemsHtml || `<tr><td colspan="7" style="text-align:center; padding: 12px;">भाजीपाला माहिती उपलब्ध नाही</td></tr>`}
    </tbody>
  </table>

  <!-- TOTALS & NOTES -->
  <div class="calc-wrapper">
    <div class="calc-left">
      ${bill.notes ? `<p><b>विशेष नोंद / शेरा:</b> ${bill.notes}</p>` : ""}
      ${upiId ? `<p style="margin-top: 4px;"><b>ऑनलाइन पेमेंट (UPI):</b> ${upiId}</p>` : ""}
      <p style="margin-top: 6px;"><b>नियम व अटी:</b> ${terms}</p>
    </div>

    <div class="calc-right">
      <table class="totals-table">
        <tr>
          <td class="total-label">भाजीपाला एकूण (Subtotal):</td>
          <td class="total-val">₹ ${subtotalFormatted}</td>
        </tr>
        ${extraRows}
        <tr class="grand-total-row">
          <td class="total-label" style="font-weight: bold; color: #1B5E20;">अंतिम देय एकूण रक्कम:</td>
          <td class="total-val" style="color: #1B5E20;">₹ ${grandTotalFormatted}</td>
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
      <div><b>${shopName} साठी</b></div>
      <div style="font-size: 10px; color: #666;">(अधिकृत सही व शिक्का)</div>
    </div>
  </div>

  <div class="footer-thanks">
    🙏 आपल्या व्यवसायाबद्दल धन्यवाद! ताज्या भाजीपाल्यासाठी पुन्हा भेट द्या. 🙏
  </div>

</body>
</html>`;
};

/**
 * Open native Android / iOS Print Preview directly.
 * Lets the user view full-page styled bill and save as PDF.
 */
export const printBill = async (bill, settings) => {
  const html = generateBillHtml(bill, settings);
  await Print.printAsync({ html });
};

/**
 * Generates the PDF file locally and triggers native Android Share dialog (WhatsApp, Drive, etc.).
 */
export const shareBillPdf = async (bill, settings) => {
  const html = generateBillHtml(bill, settings);
  const file = await Print.printToFileAsync({ html });
  if (file && file.uri) {
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: `मराठी बिल - ${bill.bill_number || "Bill"}`,
        UTI: "com.adobe.pdf",
      });
      return file.uri;
    }
  }
  return null;
};
