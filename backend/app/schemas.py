from typing import List, Optional
from pydantic import BaseModel, Field

# --- VENDOR SCHEMAS (व्हेंडर मॉडेल्स) ---
class VendorBase(BaseModel):
    name: str = Field(..., description="व्हेंडरचे नाव")
    mobile: Optional[str] = Field(None, description="मोबाइल नंबर")
    address: Optional[str] = Field(None, description="पत्ता / मंडी / गाव")
    notes: Optional[str] = Field(None, description="शेरा / विशेष नोंद")

class VendorCreate(VendorBase):
    pass

class VendorUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class VendorResponse(VendorBase):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# --- BILL ITEM SCHEMAS (बिलातील भाजीपाला वस्तू) ---
class BillItemCreate(BaseModel):
    vendor_id: Optional[int] = Field(None, description="संबंधित व्हेंडर आयडी")
    item_name: str = Field(..., description="भाजीचे नाव (उदा. कांदा, बटाटा)")
    unit: str = Field("किलो", description="एकक (उदा. किलो, क्विंटल, पोते, क्रेट, जुडी)")
    quantity: float = Field(..., gt=0, description="प्रमाण / वजन")
    rate: float = Field(..., gt=0, description="दर प्रति एकक")

class BillItemResponse(BaseModel):
    id: int
    bill_id: int
    vendor_id: Optional[int] = None
    vendor_name: Optional[str] = "सामाईक/इतर"
    item_name: str
    unit: str
    quantity: float
    rate: float
    amount: float

    class Config:
        from_attributes = True


# --- BILL SCHEMAS (बिल मॉडेल्स) ---
class BillCreate(BaseModel):
    customer_name: str = Field(..., description="ग्राहकाचे नाव")
    customer_mobile: Optional[str] = Field("", description="ग्राहकाचा मोबाइल नंबर")
    bill_date: str = Field(..., description="दिनांक (YYYY-MM-DD किंवा DD-MM-YYYY)")
    payment_status: Optional[str] = Field("रोख", description="देयक स्थिती (रोख / उधारी / ऑनलाइन)")
    transport_charges: Optional[float] = Field(0.0, description="वाहतूक किंवा हमाली खर्च")
    discount: Optional[float] = Field(0.0, description="दिलेली सूट")
    notes: Optional[str] = Field("", description="विशेष शेरा")
    items: List[BillItemCreate] = Field(..., min_items=1, description="भाजीपाला मालाची यादी")

class BillResponse(BaseModel):
    id: int
    bill_number: str
    customer_name: str
    customer_mobile: Optional[str] = ""
    bill_date: str
    payment_status: str
    subtotal: float
    transport_charges: float
    discount: float
    grand_total: float
    notes: Optional[str] = ""
    items: List[BillItemResponse] = []
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


# --- SHOP SETTINGS SCHEMAS (दुकान सेटिंग्ज) ---
class ShopSettingsBase(BaseModel):
    shop_name: str = "श्री गणेश व्हेजिटेबल ट्रेडर्स"
    owner_name: str = "गणेश पाटील"
    mobile: str = "९८७६५४३२१०"
    address: str = "गाळा नं. २४, नवीन भाजी मार्केट यार्ड, पुणे"
    tagline: str = "सर्व प्रकारच्या ताज्या भाजीपाल्याचे घाऊक व्यापारी"
    upi_id: str = "ganeshvegetables@upi"
    terms: str = "माल तपासून खात्री करून घ्यावा. नंतर कोणतीही तक्रार स्वीकारली जाणार नाही."

class ShopSettingsUpdate(BaseModel):
    shop_name: Optional[str] = None
    owner_name: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None
    tagline: Optional[str] = None
    upi_id: Optional[str] = None
    terms: Optional[str] = None

class ShopSettingsResponse(ShopSettingsBase):
    id: int

    class Config:
        from_attributes = True


# --- DASHBOARD STATS (डॅशबोर्ड सांख्यिकी) ---
class DashboardStats(BaseModel):
    total_sales_today: float
    total_sales_month: float
    total_bills_count: int
    total_vendors_count: int
    recent_bills: List[dict]


# --- AUTH SCHEMAS (ॲडमिन लॉगिन) ---
class LoginRequest(BaseModel):
    username: str = Field(..., description="वापरकर्ता नाव (उदा. admin)")
    password: str = Field(..., description="पासवर्ड")

class LoginResponse(BaseModel):
    success: bool
    message: str
    user: Optional[dict] = None
    token: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    username: str
    old_password: str
    new_password: str

