-- ============================================================================
-- भाजीपाला घाऊक बिलिंग प्रणाली - डेटाबेस रचना (Database Schema)
-- सुसंगत: SQLite / PostgreSQL / MySQL
-- ============================================================================

-- १. व्हेंडर / पुरवठादार शेतकरी टेबल (Vendors Table)
CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(150) NOT NULL,            -- व्हेंडरचे / शेतकऱ्याचे नाव
    mobile VARCHAR(20),                     -- मोबाइल नंबर
    address VARCHAR(255),                   -- पत्ता / मार्केट यार्ड गाळा / गाव
    notes TEXT,                             -- शेरा (उदा. कांदा-बटाटा पुरवठादार)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);

-- २. घाऊक बिले मुख्य टेबल (Bills Table)
CREATE TABLE IF NOT EXISTS bills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_number VARCHAR(50) UNIQUE NOT NULL,-- बिल क्रमांक (उदा. बिल-20261001-001)
    customer_name VARCHAR(150) NOT NULL,   -- ग्राहकाचे नाव (उदा. संतोष सुपर मार्केट)
    customer_mobile VARCHAR(20),            -- ग्राहक मोबाइल नंबर
    bill_date VARCHAR(30) NOT NULL,         -- दिनांक (YYYY-MM-DD)
    payment_status VARCHAR(50) DEFAULT 'रोख',-- देयक स्थिती (रोख / उधारी / ऑनलाइन)
    subtotal REAL DEFAULT 0.0,              -- एकूण भाजीपाला रक्कम (₹)
    transport_charges REAL DEFAULT 0.0,     -- वाहतूक किंवा हमाली खर्च (+)
    discount REAL DEFAULT 0.0,              -- दिलेली विशेष सूट (-)
    grand_total REAL DEFAULT 0.0,           -- अंतिम एकूण देय रक्कम (₹)
    notes TEXT,                             -- बिलावरील विशेष नोंद
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bills_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_customer ON bills(customer_name);
CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(bill_date);

-- ३. बिलातील भाजीपाला वस्तू व व्हेंडर जोडणी टेबल (Bill Items Table)
CREATE TABLE IF NOT EXISTS bill_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    bill_id INTEGER NOT NULL,               -- मुख्य बिलाचा आयडी
    vendor_id INTEGER,                      -- या विशिष्ट भाजीचा पुरवठादार व्हेंडर
    item_name VARCHAR(100) NOT NULL,        -- भाजीचे नाव (उदा. कांदा, बटाटा, टोमॅटो)
    unit VARCHAR(50) DEFAULT 'किलो',         -- एकक (किलो / पोते / क्रेट / क्विंटल / जुडी)
    quantity REAL NOT NULL,                 -- प्रमाण किंवा वजन
    rate REAL NOT NULL,                     -- दर प्रति एकक (₹)
    amount REAL NOT NULL,                   -- एकूण रक्कम (प्रमाण x दर)
    FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_bill_items_vendor_id ON bill_items(vendor_id);

-- ४. दुकान व व्यापारी प्रोफाइल सेटिंग्ज टेबल (Shop Settings Table)
CREATE TABLE IF NOT EXISTS shop_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_name VARCHAR(200) NOT NULL,        -- दुकानाचे / पेढीचे नाव
    owner_name VARCHAR(150),                -- मालकाचे नाव
    mobile VARCHAR(50),                     -- संपर्क क्रमांक
    address VARCHAR(255),                   -- मार्केट यार्ड पत्ता
    tagline VARCHAR(255),                   -- घोषवाक्य
    upi_id VARCHAR(100),                    -- ऑनलाइन पेमेंट (UPI ID)
    terms TEXT                              -- नियम व अटी (पावतीवर छापण्यासाठी)
);
