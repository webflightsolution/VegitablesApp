from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True) # व्हेंडरचे नाव
    mobile = Column(String(20), nullable=True)             # मोबाइल नं.
    address = Column(String(255), nullable=True)           # पत्ता / गाव
    notes = Column(Text, nullable=True)                    # शेरा
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    items = relationship("BillItem", back_populates="vendor")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "mobile": self.mobile or "",
            "address": self.address or "",
            "notes": self.notes or "",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    bill_number = Column(String(50), unique=True, index=True, nullable=False) # बिल क्र.
    customer_name = Column(String(150), nullable=False, index=True)          # ग्राहकाचे नाव
    customer_mobile = Column(String(20), nullable=True)                      # ग्राहक मोबाइल
    bill_date = Column(String(30), nullable=False)                          # दिनांक (YYYY-MM-DD)
    payment_status = Column(String(50), default="रोख")                      # रोख / उधारी / ऑनलाइन
    subtotal = Column(Float, default=0.0)                                   # एकूण भाजीपाला रक्कम
    transport_charges = Column(Float, default=0.0)                          # वाहतूक / हमाली
    discount = Column(Float, default=0.0)                                   # सूट
    grand_total = Column(Float, default=0.0)                                # अंतिम एकूण देय रक्कम
    notes = Column(Text, nullable=True)                                     # शेरा
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship to Items
    items = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "bill_number": self.bill_number,
            "customer_name": self.customer_name,
            "customer_mobile": self.customer_mobile or "",
            "bill_date": self.bill_date,
            "payment_status": self.payment_status or "रोख",
            "subtotal": round(self.subtotal, 2),
            "transport_charges": round(self.transport_charges, 2),
            "discount": round(self.discount, 2),
            "grand_total": round(self.grand_total, 2),
            "notes": self.notes or "",
            "items": [item.to_dict() for item in self.items],
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class BillItem(Base):
    __tablename__ = "bill_items"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id", ondelete="CASCADE"), nullable=False)
    vendor_id = Column(Integer, ForeignKey("vendors.id", ondelete="SET NULL"), nullable=True) # विशिष्ट व्हेंडर
    item_name = Column(String(100), nullable=False) # भाजीचे नाव (उदा. कांदा, बटाटा)
    unit = Column(String(50), default="किलो")        # एकक (किलो / क्विंटल / पोते / क्रेट / जुडी)
    quantity = Column(Float, nullable=False)        # प्रमाण / वजन
    rate = Column(Float, nullable=False)            # दर (प्रति एकक)
    amount = Column(Float, nullable=False)          # एकूण रक्कम (प्रमाण x दर)

    # Relationships
    bill = relationship("Bill", back_populates="items")
    vendor = relationship("Vendor", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "bill_id": self.bill_id,
            "vendor_id": self.vendor_id,
            "vendor_name": self.vendor.name if self.vendor else "सामाईक/इतर",
            "item_name": self.item_name,
            "unit": self.unit,
            "quantity": self.quantity,
            "rate": self.rate,
            "amount": round(self.amount, 2)
        }


class ShopSettings(Base):
    __tablename__ = "shop_settings"

    id = Column(Integer, primary_key=True, index=True)
    shop_name = Column(String(200), default="श्री गणेश व्हेजिटेबल ट्रेडर्स")
    owner_name = Column(String(150), default="गणेश पाटील")
    mobile = Column(String(50), default="९८७६५४३२१०")
    address = Column(String(255), default="गाळा नं. २४, नवीन भाजी मार्केट यार्ड, पुणे")
    tagline = Column(String(255), default="सर्व प्रकारच्या ताज्या भाजीपाल्याचे घाऊक व्यापारी")
    upi_id = Column(String(100), default="ganeshvegetables@upi")
    terms = Column(Text, default="माल तपासून खात्री करून घ्यावा. नंतर कोणतीही तक्रार स्वीकारली जाणार नाही.")

    def to_dict(self):
        return {
            "id": self.id,
            "shop_name": self.shop_name,
            "owner_name": self.owner_name,
            "mobile": self.mobile,
            "address": self.address,
            "tagline": self.tagline,
            "upi_id": self.upi_id,
            "terms": self.terms
        }


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password = Column(String(100), nullable=False)
    full_name = Column(String(100), default="मुख्य ॲडमिन")
    role = Column(String(50), default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "full_name": self.full_name,
            "role": self.role
        }

