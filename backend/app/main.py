import urllib.parse
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from .database import engine, Base, get_db
from . import models, schemas, crud
from .pdf_generator import generate_bill_pdf

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="भाजीपाला घाऊक बिलिंग प्रणाली API (Vegetable Wholesaler Billing API)",
    description="मराठी भाजीपाला व्यापारी व व्हेंडर व्यवस्थापन प्रणाली",
    version="1.0.0"
)

# Enable CORS for React Native & Web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    # Seed default data on startup
    db = next(get_db())
    try:
        crud.seed_default_data(db)
    finally:
        db.close()


@app.get("/")
def read_root():
    return {
        "संदेश": "भाजीपाला घाऊक बिलिंग प्रणाली API सक्रिय आहे.",
        "status": "online",
        "version": "1.0.0",
        "qr_page": "http://localhost:5000/qr"
    }


@app.get("/qr")
def get_qr_page():
    """Expo Go QR कोड पाहण्यासाठी वेब पेज"""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "172.24.90.207"

    expo_url = f"exp://{local_ip}:8081"
    # Generate QR Code as base64
    import qrcode, base64, io
    qr = qrcode.QRCode(version=1, box_size=8, border=3)
    qr.add_data(expo_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1B5E20", back_color="#FFFFFF")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    html = f"""<!DOCTYPE html>
    <html lang="mr">
    <head>
        <meta charset="UTF-8">
        <title>Expo Go स्कॅनर - भाजीपाला बिलिंग ऍप</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                background-color: #F4F7F4;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
            }}
            .card {{
                background: white;
                padding: 30px;
                border-radius: 16px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 400px;
                border-top: 6px solid #1B5E20;
            }}
            h1 {{ color: #1B5E20; margin-bottom: 6px; font-size: 22px; }}
            p {{ color: #555; font-size: 14px; margin-top: 4px; }}
            .qr-wrap {{
                margin: 20px 0;
                padding: 12px;
                background: #F9FBF9;
                border-radius: 12px;
                display: inline-block;
                border: 2px dashed #C8E6C9;
            }}
            .qr-wrap img {{ width: 240px; height: 240px; display: block; }}
            .url-box {{
                background: #E8F5E9;
                padding: 10px;
                border-radius: 8px;
                font-family: monospace;
                font-size: 15px;
                color: #1B5E20;
                font-weight: bold;
                word-break: break-all;
            }}
            .steps {{
                text-align: left;
                margin-top: 20px;
                font-size: 13px;
                color: #444;
                line-height: 1.6;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>।। श्री गणेशाय नमः ।।</h1>
            <h2>भाजीपाला घाऊक बिलिंग</h2>
            <p>Expo Go ऍपद्वारे मोबाईलवर सुरू करण्यासाठी स्कॅन करा:</p>
            <div class="qr-wrap">
                <img src="data:image/png;base64,{qr_b64}" alt="Expo QR Code" />
            </div>
            <p style="margin-bottom: 6px; font-size: 12px; color: #777;">किंवा Expo Go मध्ये मॅन्युअली टाका:</p>
            <div class="url-box">{expo_url}</div>
            <div class="steps">
                <b>मोबाईलवर कसे चालवायचे:</b><br/>
                १. मोबाईल आणि लॅपटॉप <b>एकाच वायफाय (Wi-Fi)</b> शी जोडा.<br/>
                २. <b>Expo Go</b> ऍप उघडा आणि "Scan QR code" वर टॅप करा.<br/>
                ३. वरील QR कोड स्कॅन करताच मोबाईलवर ऍप सुरू होईल.
            </div>
        </div>
    </body>
    </html>"""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html)


@app.get("/download-apk")
def download_apk():
    """भाजीपाला बिलिंग अँड्रॉइड APK डाउनलोड"""
    import os
    from fastapi.responses import FileResponse

    apk_paths = [
        "c:/Antigravity Project/BillingApp/Bhajipala-Billing.apk",
        "c:/Antigravity Project/BillingApp/frontend/android/app/build/outputs/apk/release/app-release.apk",
        "c:/Antigravity Project/BillingApp/frontend/android/app/build/outputs/apk/debug/app-debug.apk"
    ]
    for p in apk_paths:
        if os.path.exists(p):
            return FileResponse(
                p,
                media_type="application/vnd.android.package-archive",
                filename="Bhajipala-Billing.apk"
            )
    raise HTTPException(status_code=404, detail="APK फाइल अजून तयार होत आहे, कृपया काही सेकंद थांबा...")


@app.get("/apk")
def get_apk_download_page():
    """APK डाउनलोड करण्यासाठी QR कोड आणि माहिती पान"""
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "172.24.90.207"

    download_url = f"http://{local_ip}:5000/download-apk"
    import qrcode, base64, io
    qr = qrcode.QRCode(version=1, box_size=8, border=3)
    qr.add_data(download_url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1B5E20", back_color="#FFFFFF")
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    html = f"""<!DOCTYPE html>
    <html lang="mr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>भाजीपाला बिलिंग ऍप APK डाउनलोड</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #E8F5E9;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                margin: 0;
                padding: 16px;
            }}
            .card {{
                background: white;
                padding: 28px 24px;
                border-radius: 16px;
                box-shadow: 0 8px 30px rgba(0,0,0,0.12);
                text-align: center;
                max-width: 440px;
                width: 100%;
                border-top: 6px solid #1B5E20;
            }}
            h1 {{ color: #1B5E20; margin-bottom: 4px; font-size: 22px; }}
            h2 {{ color: #2E7D32; margin-top: 0; font-size: 17px; }}
            .qr-wrap {{
                margin: 18px auto;
                padding: 12px;
                background: #F9FBF9;
                border-radius: 14px;
                display: inline-block;
                border: 2px dashed #A5D6A7;
            }}
            .qr-wrap img {{ width: 220px; height: 220px; display: block; }}
            .btn-download {{
                display: inline-block;
                background: linear-gradient(135deg, #1B5E20, #2E7D32);
                color: white;
                font-weight: bold;
                font-size: 16px;
                padding: 14px 28px;
                border-radius: 10px;
                text-decoration: none;
                margin-top: 14px;
                box-shadow: 0 4px 14px rgba(27, 94, 32, 0.35);
                transition: transform 0.1s;
            }}
            .btn-download:hover {{ transform: scale(1.02); }}
            .steps {{
                text-align: left;
                margin-top: 24px;
                padding: 16px;
                background: #F1F8E9;
                border-radius: 10px;
                font-size: 13px;
                color: #2E7D32;
                line-height: 1.7;
            }}
            .steps ol {{ margin: 6px 0 0 16px; padding: 0; }}
            .badge {{
                display: inline-block;
                background: #C8E6C9;
                color: #1B5E20;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 10px;
            }}
        </style>
    </head>
    <body>
        <div class="card">
            <div class="badge">अँड्रॉइड इन्स्टॉलर (.APK)</div>
            <h1>।। श्री गणेशाय नमः ।।</h1>
            <h2>भाजीपाला घाऊक बिलिंग ऍप</h2>
            <p style="color: #555; font-size: 14px; margin: 4px 0 12px;">मोबाईलवर थेट ऍप इन्स्टॉल करण्यासाठी खालील QR कोड स्कॅन करा किंवा बटण दाबा:</p>
            <div class="qr-wrap">
                <img src="data:image/png;base64,{qr_b64}" alt="APK Download QR" />
            </div>
            <div>
                <a href="{download_url}" class="btn-download" download>📥 APK थेट डाउनलोड करा</a>
            </div>
            <div class="steps">
                <b>मोबाईलवर कसे इन्स्टॉल करायचे:</b>
                <ol>
                    <li>मोबाईलच्या कॅमेऱ्याने वरील QR कोड स्कॅन करा किंवा डाउनलोड बटण दाबा.</li>
                    <li>फाइल डाउनलोड झाल्यावर <b>"Open"</b> वर टॅप करा.</li>
                    <li>सूचना आल्यास <b>"Install Unknown Apps"</b> परवानगी द्या.</li>
                    <li>इन्स्टॉल झाल्यानंतर <b>"Open"</b> करा.</li>
                    <li>ॲडमिन लॉगिन: वापरकर्ता <b>admin</b> | पासवर्ड <b>admin123</b></li>
                </ol>
            </div>
        </div>
    </body>
    </html>"""
    return HTMLResponse(content=html)



# ============================================================================
# ॲडमिन लॉगिन व ऑथेंटिकेशन (ADMIN AUTH ENDPOINTS)
# ============================================================================

@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login_admin(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    """ॲडमिन वापरकर्ता लॉगिन (वापरकर्ता: admin | पासवर्ड: admin123)"""
    admin = crud.authenticate_admin(db, req.username, req.password)
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="वापरकर्ता नाव किंवा पासवर्ड चुकीचा आहे."
        )
    return {
        "success": True,
        "message": f"स्वागत आहे, {admin.full_name}!",
        "user": admin.to_dict(),
        "token": f"admin_token_{admin.id}"
    }


@app.post("/api/auth/change-password")
def change_password(req: schemas.ChangePasswordRequest, db: Session = Depends(get_db)):
    """ॲडमिन पासवर्ड बदलणे"""
    success, msg = crud.change_admin_password(db, req)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"success": True, "message": msg}


# ============================================================================
# व्हेंडर व्यवस्थापन (VENDOR MANAGEMENT ENDPOINTS)
# ============================================================================

@app.get("/api/vendors", response_model=List[schemas.VendorResponse])
def get_vendors(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """सर्व व्हेंडर्सची यादी मिळवा"""
    vendors = crud.get_vendors(db, skip=skip, limit=limit)
    return [v.to_dict() for v in vendors]


@app.get("/api/vendors/{vendor_id}", response_model=schemas.VendorResponse)
def get_vendor(vendor_id: int, db: Session = Depends(get_db)):
    """विशिष्ट व्हेंडरचा तपशील मिळवा"""
    vendor = crud.get_vendor(db, vendor_id)
    if not vendor:
        raise HTTPException(status_code=404, detail="व्हेंडर सापडला नाही.")
    return vendor.to_dict()


@app.post("/api/vendors", response_model=schemas.VendorResponse, status_code=status.HTTP_201_CREATED)
def create_vendor(vendor_in: schemas.VendorCreate, db: Session = Depends(get_db)):
    """नवीन भाजीपाला व्हेंडर जोडा"""
    if not vendor_in.name.strip():
        raise HTTPException(status_code=400, detail="व्हेंडरचे नाव आवश्यक आहे.")
    vendor = crud.create_vendor(db, vendor_in)
    return vendor.to_dict()


@app.put("/api/vendors/{vendor_id}", response_model=schemas.VendorResponse)
def update_vendor(vendor_id: int, vendor_in: schemas.VendorUpdate, db: Session = Depends(get_db)):
    """व्हेंडरची माहिती अद्ययावत करा"""
    vendor = crud.update_vendor(db, vendor_id, vendor_in)
    if not vendor:
        raise HTTPException(status_code=404, detail="व्हेंडर सापडला नाही.")
    return vendor.to_dict()


@app.delete("/api/vendors/{vendor_id}")
def delete_vendor(vendor_id: int, db: Session = Depends(get_db)):
    """व्हेंडर हटवा"""
    success = crud.delete_vendor(db, vendor_id)
    if not success:
        raise HTTPException(status_code=404, detail="व्हेंडर सापडला नाही.")
    return {"message": "व्हेंडर यशस्वीरीत्या हटवला गेला."}


# ============================================================================
# बिलिंग प्रणाली (BILLING SYSTEM ENDPOINTS)
# ============================================================================

@app.get("/api/bills", response_model=List[schemas.BillResponse])
def get_bills(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = "",
    db: Session = Depends(get_db)
):
    """सर्व बिलांची यादी मिळवा (शोध सुविधा उपलब्ध)"""
    bills = crud.get_bills(db, skip=skip, limit=limit, search=search)
    return [b.to_dict() for b in bills]


@app.get("/api/bills/{bill_id}", response_model=schemas.BillResponse)
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    """विशिष्ट बिलाचा संपूर्ण तपशील मिळवा"""
    bill = crud.get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="बिल सापडले नाही.")
    return bill.to_dict()


@app.post("/api/bills", response_model=schemas.BillResponse, status_code=status.HTTP_201_CREATED)
def create_bill(bill_in: schemas.BillCreate, db: Session = Depends(get_db)):
    """नवीन घाऊक भाजीपाला बिल तयार करा"""
    if not bill_in.customer_name.strip():
        raise HTTPException(status_code=400, detail="ग्राहकाचे नाव आवश्यक आहे.")
    if not bill_in.items:
        raise HTTPException(status_code=400, detail="किमान एक भाजीपाला वस्तू आवश्यक आहे.")

    bill = crud.create_bill(db, bill_in)
    return bill.to_dict()


@app.delete("/api/bills/{bill_id}")
def delete_bill(bill_id: int, db: Session = Depends(get_db)):
    """बिल हटवा"""
    success = crud.delete_bill(db, bill_id)
    if not success:
        raise HTTPException(status_code=404, detail="बिल सापडले नाही.")
    return {"message": "बिल यशस्वीरीत्या हटवले गेले."}


# ============================================================================
# PDF निर्मिती व शेअरिंग (MARATHI PDF & WHATSAPP SHARING)
# ============================================================================

@app.get("/api/bills/{bill_id}/pdf")
def get_bill_pdf(bill_id: int, db: Session = Depends(get_db)):
    """मराठी भाषेतील व्यावसायिक PDF बिल तयार करून डाउनलोड करा"""
    bill = crud.get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="बिल सापडले नाही.")

    settings = crud.get_settings(db)
    pdf_buffer = generate_bill_pdf(bill, settings)

    safe_filename = f"bill_{bill.id}.pdf"
    encoded_filename = urllib.parse.quote(f"{bill.bill_number}.pdf")
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{safe_filename}"; filename*=UTF-8\'\'{encoded_filename}',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@app.get("/api/bills/{bill_id}/whatsapp-link")
def get_whatsapp_link(bill_id: int, db: Session = Depends(get_db)):
    """WhatsApp द्वारे पाठवण्यासाठी मराठी मजकूर व थेट लिंक मिळवा"""
    bill = crud.get_bill(db, bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="बिल सापडले नाही.")

    settings = crud.get_settings(db)

    # Prepare formatted Marathi WhatsApp message
    lines = [
        f"*{settings.shop_name}*",
        f"_{settings.tagline}_",
        "------------------------------------",
        f"📄 *बिल क्रमांक:* {bill.bill_number}",
        f"📅 *दिनांक:* {bill.bill_date}",
        f"👤 *ग्राहक:* {bill.customer_name}",
        f"💳 *स्थिती:* {bill.payment_status}",
        "------------------------------------",
        "*भाजीपाला तपशील:*",
    ]

    for idx, item in enumerate(bill.items, start=1):
        v_name = f" ({item.vendor.name})" if item.vendor else ""
        lines.append(f"{idx}. {item.item_name}{v_name} - {item.quantity} {item.unit} x ₹{item.rate} = ₹{item.amount}")

    lines.append("------------------------------------")
    lines.append(f"भाजीपाला एकूण: ₹{bill.subtotal:,.2f}")
    if bill.transport_charges > 0:
        lines.append(f"वाहतूक/हमाली: +₹{bill.transport_charges:,.2f}")
    if bill.discount > 0:
        lines.append(f"सूट/कपात: -₹{bill.discount:,.2f}")
    lines.append(f"💰 *अंतिम देय एकूण: ₹{bill.grand_total:,.2f}*")
    lines.append("------------------------------------")
    if settings.upi_id:
        lines.append(f"UPI पेमेंट: {settings.upi_id}")
    lines.append("🙏 धन्यवाद! पुन्हा भेट द्या. 🙏")

    message_text = "\n".join(lines)
    encoded_text = urllib.parse.quote(message_text)

    # Phone target if customer mobile exists
    phone = bill.customer_mobile.strip().replace("+", "").replace(" ", "").replace("-", "") if bill.customer_mobile else ""
    if phone and len(phone) == 10:
        phone = f"91{phone}"

    wa_url = f"https://wa.me/{phone}?text={encoded_text}" if phone else f"https://wa.me/?text={encoded_text}"

    return {
        "bill_id": bill.id,
        "bill_number": bill.bill_number,
        "customer_mobile": bill.customer_mobile,
        "message_text": message_text,
        "whatsapp_url": wa_url
    }


# ============================================================================
# डॅशबोर्ड व दुकान प्रोफाइल (DASHBOARD & SETTINGS)
# ============================================================================

@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    """डॅशबोर्ड सांख्यिकी व सारांश"""
    return crud.get_dashboard_stats(db)


@app.get("/api/settings", response_model=schemas.ShopSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    """व्यापारी व दुकान माहिती मिळवा"""
    return crud.get_settings(db).to_dict()


@app.put("/api/settings", response_model=schemas.ShopSettingsResponse)
def update_settings(settings_in: schemas.ShopSettingsUpdate, db: Session = Depends(get_db)):
    """व्यापारी व दुकान माहिती अद्ययावत करा"""
    return crud.update_settings(db, settings_in).to_dict()
