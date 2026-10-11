import base64
import os
import socket
import qrcode
import io

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "10.215.79.207"

local_ip = get_local_ip()
download_url = f"http://{local_ip}:5000/download-apk"
print(f"Generating QR for: {download_url}")

# Generate QR image
qr = qrcode.QRCode(
    version=1,
    error_correction=qrcode.constants.ERROR_CORRECT_H,
    box_size=10,
    border=4,
)
qr.add_data(download_url)
qr.make(fit=True)
img = qr.make_image(fill_color="#1B5E20", back_color="#FFFFFF")
img.save("apk_download_qr.png")

# Also save into brain artifacts
artifact_qr = r"C:\Users\DELL\.gemini\antigravity-ide\brain\6ea5bb87-a705-4465-829b-b08064b517de\apk_download_qr.png"
try:
    img.save(artifact_qr)
except Exception:
    pass

buf = io.BytesIO()
img.save(buf, format="PNG")
b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

html = f"""<!DOCTYPE html>
<html lang="mr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>भाजीपाला बिलिंग APK QR कोड</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #E8F5E9;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }}
        .card {{
            background: white;
            padding: 32px 24px;
            border-radius: 20px;
            text-align: center;
            box-shadow: 0 12px 36px rgba(0,0,0,0.12);
            border-top: 8px solid #2E7D32;
            max-width: 440px;
            width: 100%;
        }}
        h2 {{ color: #2E7D32; margin: 0 0 6px; font-size: 22px; }}
        h3 {{ color: #1B5E20; margin: 0 0 16px; font-size: 18px; }}
        p {{ color: #444; font-size: 14px; margin: 8px 0; }}
        .qr-box {{
            background: #F4FBF4;
            padding: 16px;
            border-radius: 16px;
            display: inline-block;
            margin: 16px 0;
            border: 2px dashed #81C784;
        }}
        img {{
            width: 250px;
            height: 250px;
            display: block;
        }}
        .btn {{
            display: inline-block;
            padding: 14px 28px;
            background: linear-gradient(135deg, #1B5E20, #2E7D32);
            color: white;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            font-size: 15px;
            margin-top: 10px;
            box-shadow: 0 4px 12px rgba(46,125,50,0.3);
        }}
        .info-box {{
            margin-top: 20px;
            background: #F1F8E9;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            color: #2E7D32;
            text-align: left;
            word-break: break-all;
        }}
    </style>
</head>
<body>
    <div class="card">
        <h2>।। श्री गणेशाय नमः ।।</h2>
        <h3>भाजीपाला घाऊक बिलिंग ऍप</h3>
        <p>खालील QR कोड तुमच्या मोबाईल कॅमेरा किंवा Google Lens ने स्कॅन करा:</p>
        <div class="qr-box">
            <img src="data:image/png;base64,{b64}" alt="APK Download QR" />
        </div>
        <div>
            <a class="btn" href="{download_url}" target="_blank">मोबाईलवर थेट डाउनलोड करा</a>
        </div>
        <div class="info-box">
            <strong>थेट डाउनलोड लिंक:</strong><br>
            <a href="{download_url}" style="color:#1B5E20;">{download_url}</a>
            <br><br>
            <strong>संगणकावरील APK फाईल:</strong><br>
            <code>c:\\Antigravity Project\\BillingApp\\Bhajipala-Billing.apk</code>
        </div>
    </div>
</body>
</html>
"""

with open('qr.html', 'w', encoding='utf-8') as f:
    f.write(html)
print("qr.html & apk_download_qr.png updated successfully!")
