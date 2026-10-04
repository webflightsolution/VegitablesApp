import requests
import json

BASE = "http://127.0.0.1:5000"

def run_tests():
    print("--- भाजीपाला घाऊक बिलिंग प्रणाली: एकात्मिक चाचणी सुरू ---")

    # 1. Fetch vendors
    r_vendors = requests.get(f"{BASE}/api/vendors")
    assert r_vendors.status_code == 200, f"Vendors failed: {r_vendors.text}"
    vendors = r_vendors.json()
    print(f"[चाचणी १ यशस्वी] डेटाबेसमधून एकूण {len(vendors)} व्हेंडर्स प्राप्त झाले.")

    # 2. Create new vendor
    new_vendor_payload = {
        "name": "शिंदे फार्म्स (मंचर)",
        "mobile": "9812345678",
        "address": "मंचर भाजी मार्केट, आंबेगाव",
        "notes": "टोमॅटो व कोबी थेट शेतातील पुरवठा"
    }
    r_create_v = requests.post(f"{BASE}/api/vendors", json=new_vendor_payload)
    assert r_create_v.status_code == 201, f"Create vendor failed: {r_create_v.text}"
    created_vendor = r_create_v.json()
    v_id = created_vendor['id']
    v_name = created_vendor['name']
    print(f"[चाचणी २ यशस्वी] नवीन व्हेंडर तयार झाला: ID {v_id} - {v_name}")

    # 3. Create a bill with multiple vendors
    v1_id = vendors[0]["id"]
    v2_id = created_vendor["id"]

    bill_payload = {
        "customer_name": "महादेव भाजी भांडार (हडपसर)",
        "customer_mobile": "9890011223",
        "bill_date": "2026-10-01",
        "payment_status": "रोख",
        "transport_charges": 200.0,
        "discount": 100.0,
        "notes": "सकाळी ६ वाजता गाडीने माल पोहोचवणे.",
        "items": [
            {
                "vendor_id": v1_id,
                "item_name": "कांदा (लाल)",
                "unit": "पोते (५० किलो)",
                "quantity": 4,
                "rate": 1200
            },
            {
                "vendor_id": v2_id,
                "item_name": "टोमॅटो (मंचर विशेष)",
                "unit": "क्रेट (२० किलो)",
                "quantity": 5,
                "rate": 400
            }
        ]
    }

    r_bill = requests.post(f"{BASE}/api/bills", json=bill_payload)
    assert r_bill.status_code == 201, f"Create bill failed: {r_bill.text}"
    bill = r_bill.json()
    bill_no = bill['bill_number']
    subtotal = bill['subtotal']
    grand_total = bill['grand_total']
    print(f"[चाचणी ३ यशस्वी] नवीन बिल तयार झाले: {bill_no} | एकूण भाजीपाला: ₹{subtotal} | अंतिम देय: ₹{grand_total}")
    assert subtotal == 6800.0, f"Subtotal mismatch: {subtotal}" # (4*1200 + 5*400) = 4800 + 2000 = 6800
    assert grand_total == 6900.0, f"Grand total mismatch: {grand_total}" # 6800 + 200 - 100 = 6900

    # 4. Generate & Download PDF
    r_pdf = requests.get(f"{BASE}/api/bills/{bill['id']}/pdf")
    assert r_pdf.status_code == 200, f"PDF failed: {r_pdf.status_code}"
    assert r_pdf.content.startswith(b"%PDF"), "Not a valid PDF file!"
    print(f"[चाचणी ४ यशस्वी] मराठी PDF बिल यशस्वीरीत्या तयार झाले! आकार: {len(r_pdf.content)} बाईट्स (अस्सल PDF फॉर्मॅट)")

    # 5. WhatsApp Link
    r_wa = requests.get(f"{BASE}/api/bills/{bill['id']}/whatsapp-link")
    assert r_wa.status_code == 200, f"WhatsApp link failed: {r_wa.status_code}"
    wa_data = r_wa.json()
    assert "whatsapp_url" in wa_data and "https://wa.me/" in wa_data["whatsapp_url"], "Invalid WhatsApp URL"
    print(f"[चाचणी ५ यशस्वी] WhatsApp शेअरिंग मजकूर व लिंक तयार झाली.")

    # 6. Dashboard Stats
    r_dash = requests.get(f"{BASE}/api/dashboard")
    dash = r_dash.json()
    print(f"[चाचणी ६ यशस्वी] डॅशबोर्ड सांख्यिकी अद्ययावत झाली: एकूण बिले: {dash['total_bills_count']}, आजची विक्री: ₹{dash['total_sales_today']}")

    print("\nसर्व ६ चाचण्या १००% यशस्वी झाल्या! (ALL 6 INTEGRATION TESTS PASSED!)")

if __name__ == "__main__":
    run_tests()
