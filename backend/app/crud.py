from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import func
from .models import Vendor, Bill, BillItem, ShopSettings, AdminUser
from .schemas import VendorCreate, VendorUpdate, BillCreate, ShopSettingsUpdate, LoginRequest, ChangePasswordRequest

# --- VENDOR CRUD ---

def get_vendors(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Vendor).order_by(Vendor.name.asc()).offset(skip).limit(limit).all()

def get_vendor(db: Session, vendor_id: int):
    return db.query(Vendor).filter(Vendor.id == vendor_id).first()

def create_vendor(db: Session, vendor_in: VendorCreate):
    vendor = Vendor(
        name=vendor_in.name.strip(),
        mobile=vendor_in.mobile.strip() if vendor_in.mobile else "",
        address=vendor_in.address.strip() if vendor_in.address else "",
        notes=vendor_in.notes.strip() if vendor_in.notes else ""
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor

def update_vendor(db: Session, vendor_id: int, vendor_in: VendorUpdate):
    vendor = get_vendor(db, vendor_id)
    if not vendor:
        return None
    if vendor_in.name is not None:
        vendor.name = vendor_in.name.strip()
    if vendor_in.mobile is not None:
        vendor.mobile = vendor_in.mobile.strip()
    if vendor_in.address is not None:
        vendor.address = vendor_in.address.strip()
    if vendor_in.notes is not None:
        vendor.notes = vendor_in.notes.strip()
    db.commit()
    db.refresh(vendor)
    return vendor

def delete_vendor(db: Session, vendor_id: int):
    vendor = get_vendor(db, vendor_id)
    if not vendor:
        return False
    db.delete(vendor)
    db.commit()
    return True


# --- BILL CRUD ---

def generate_bill_number(db: Session) -> str:
    today_str = datetime.now().strftime("%Y%m%d")
    count = db.query(Bill).filter(Bill.bill_number.like(f"बिल-{today_str}-%")).count()
    return f"बिल-{today_str}-{(count + 1):03d}"

def create_bill(db: Session, bill_in: BillCreate):
    bill_number = generate_bill_number(db)
    
    subtotal = 0.0
    items_to_add = []
    
    for it in bill_in.items:
        amount = round(float(it.quantity) * float(it.rate), 2)
        subtotal += amount
        items_to_add.append({
            "vendor_id": it.vendor_id,
            "item_name": it.item_name.strip(),
            "unit": it.unit.strip(),
            "quantity": it.quantity,
            "rate": it.rate,
            "amount": amount
        })

    transport = float(bill_in.transport_charges or 0.0)
    disc = float(bill_in.discount or 0.0)
    grand_total = max(0.0, round(subtotal + transport - disc, 2))

    bill = Bill(
        bill_number=bill_number,
        customer_name=bill_in.customer_name.strip(),
        customer_mobile=bill_in.customer_mobile.strip() if bill_in.customer_mobile else "",
        bill_date=bill_in.bill_date or datetime.now().strftime("%Y-%m-%d"),
        payment_status=bill_in.payment_status or "रोख",
        subtotal=round(subtotal, 2),
        transport_charges=round(transport, 2),
        discount=round(disc, 2),
        grand_total=grand_total,
        notes=bill_in.notes.strip() if bill_in.notes else ""
    )
    db.add(bill)
    db.flush() # get bill.id

    for item_data in items_to_add:
        item = BillItem(
            bill_id=bill.id,
            vendor_id=item_data["vendor_id"],
            item_name=item_data["item_name"],
            unit=item_data["unit"],
            quantity=item_data["quantity"],
            rate=item_data["rate"],
            amount=item_data["amount"]
        )
        db.add(item)

    db.commit()
    db.refresh(bill)
    return bill

def get_bills(db: Session, skip: int = 0, limit: int = 100, search: str = ""):
    query = db.query(Bill)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Bill.customer_name.ilike(s)) | (Bill.bill_number.ilike(s)))
    return query.order_by(Bill.id.desc()).offset(skip).limit(limit).all()

def get_bill(db: Session, bill_id: int):
    return db.query(Bill).filter(Bill.id == bill_id).first()

def delete_bill(db: Session, bill_id: int):
    bill = get_bill(db, bill_id)
    if not bill:
        return False
    db.delete(bill)
    db.commit()
    return True


# --- SHOP SETTINGS CRUD ---

def get_settings(db: Session) -> ShopSettings:
    settings = db.query(ShopSettings).first()
    if not settings:
        settings = ShopSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

def update_settings(db: Session, settings_in: ShopSettingsUpdate) -> ShopSettings:
    settings = get_settings(db)
    if settings_in.shop_name is not None:
        settings.shop_name = settings_in.shop_name.strip()
    if settings_in.owner_name is not None:
        settings.owner_name = settings_in.owner_name.strip()
    if settings_in.mobile is not None:
        settings.mobile = settings_in.mobile.strip()
    if settings_in.address is not None:
        settings.address = settings_in.address.strip()
    if settings_in.tagline is not None:
        settings.tagline = settings_in.tagline.strip()
    if settings_in.upi_id is not None:
        settings.upi_id = settings_in.upi_id.strip()
    if settings_in.terms is not None:
        settings.terms = settings_in.terms.strip()
    db.commit()
    db.refresh(settings)
    return settings


# --- DASHBOARD STATS ---

def get_dashboard_stats(db: Session):
    today_str = datetime.now().strftime("%Y-%m-%d")
    month_str = datetime.now().strftime("%Y-%m")

    # Today's sales
    today_bills = db.query(Bill).filter(Bill.bill_date == today_str).all()
    sales_today = sum(b.grand_total for b in today_bills)

    # Monthly sales
    month_bills = db.query(Bill).filter(Bill.bill_date.like(f"{month_str}%")).all()
    sales_month = sum(b.grand_total for b in month_bills)

    total_bills = db.query(Bill).count()
    total_vendors = db.query(Vendor).count()

    recent_bills = db.query(Bill).order_by(Bill.id.desc()).limit(5).all()

    return {
        "total_sales_today": round(sales_today, 2),
        "total_sales_month": round(sales_month, 2),
        "total_bills_count": total_bills,
        "total_vendors_count": total_vendors,
        "recent_bills": [b.to_dict() for b in recent_bills]
    }


# --- AUTH CRUD (ॲडमिन ऑथेंटिकेशन) ---

def authenticate_admin(db: Session, username: str, password: str):
    admin = db.query(AdminUser).filter(AdminUser.username == username.strip()).first()
    if not admin:
        return None
    # For robust local deployment: direct match or hash
    if admin.password == password.strip():
        return admin
    return None

def change_admin_password(db: Session, req: ChangePasswordRequest):
    admin = db.query(AdminUser).filter(AdminUser.username == req.username.strip()).first()
    if not admin:
        return False, "वापरकर्ता सापडला नाही."
    if admin.password != req.old_password.strip():
        return False, "जुना पासवर्ड चुकीचा आहे."
    admin.password = req.new_password.strip()
    db.commit()
    return True, "पासवर्ड यशस्वीरीत्या बदलला गेला."


# --- SEED DATA ---

def seed_default_data(db: Session):
    # Ensure settings exist
    get_settings(db)

    # Seed initial Admin User if none exists
    if db.query(AdminUser).count() == 0:
        default_admin = AdminUser(
            username="admin",
            password="admin123",
            full_name="मुख्य ॲडमिन (मालक)",
            role="admin"
        )
        db.add(default_admin)
        db.commit()

    # Seed initial vendors if none exist
    if db.query(Vendor).count() == 0:
        sample_vendors = [
            Vendor(
                name="आनंद भाजी मंडई (नाशिक)",
                mobile="९८२०१२३४५६",
                address="मार्केट यार्ड, नाशिक",
                notes="कांदा, बटाटा आणि लसूण पुरवठादार"
            ),
            Vendor(
                name="पाटील व्हेजिटेबल फार्म (जुन्नर)",
                mobile="९८९०२३४५६७",
                address="नारायणगाव, जुन्नर",
                notes="टोमॅटो आणि शिमला मिरची"
            ),
            Vendor(
                name="कृष्णा ॲग्रो ट्रेडर्स (पुणे)",
                mobile="९७६५३४५६७८",
                address="गाळा नं. १२, गुलटेकडी मार्केट यार्ड, पुणे",
                notes="कोथिंबीर, मेथी आणि हिरव्या पालेभाज्या"
            ),
            Vendor(
                name="सह्याद्री फार्मर्स ग्रुप (इंदापूर)",
                mobile="९१५८४५६७८९",
                address="इंदापूर बायपास, पुणे जिल्हा",
                notes="कोबी, फ्लॉवर आणि गाजर"
            ),
            Vendor(
                name="गणेश शेतकरी उत्पादक संघ (सांगली)",
                mobile="९८२२५६७८९०",
                address="मिरज रोड, सांगली",
                notes="आले, हळद, हिरवी मिरची"
            )
        ]
        db.add_all(sample_vendors)
        db.commit()

        # Also seed a sample bill so trader sees realistic data immediately
        v1 = db.query(Vendor).first()
        v2 = db.query(Vendor).offset(1).first()
        sample_bill = Bill(
            bill_number=f"बिल-{datetime.now().strftime('%Y%m%d')}-001",
            customer_name="संतोष किराणा व भाजी केंद्र",
            customer_mobile="९४२२०११२२३",
            bill_date=datetime.now().strftime("%Y-%m-%d"),
            payment_status="रोख",
            subtotal=3450.0,
            transport_charges=150.0,
            discount=50.0,
            grand_total=3550.0,
            notes="पहिला माल टेम्पोने रवाना केला."
        )
        db.add(sample_bill)
        db.flush()

        items = [
            BillItem(
                bill_id=sample_bill.id,
                vendor_id=v1.id if v1 else None,
                item_name="कांदा (लाल)",
                unit="पोते (५० किलो)",
                quantity=2.0,
                rate=1100.0,
                amount=2200.0
            ),
            BillItem(
                bill_id=sample_bill.id,
                vendor_id=v2.id if v2 else None,
                item_name="टोमॅटो (हायब्रिड)",
                unit="क्रेट (२० किलो)",
                quantity=3.0,
                rate=350.0,
                amount=1050.0
            ),
            BillItem(
                bill_id=sample_bill.id,
                vendor_id=v1.id if v1 else None,
                item_name="बटाटा (आग्रा)",
                unit="किलो",
                quantity=10.0,
                rate=20.0,
                amount=200.0
            )
        ]
        db.add_all(items)
        db.commit()
