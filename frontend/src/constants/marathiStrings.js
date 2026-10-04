// संपूर्ण मराठी शब्दकोश व मजकूर (Marathi Dictionary & UI Strings)
export const STRINGS = {
  appName: "भाजीपाला घाऊक बिलिंग",
  appTagline: "शेतकरी व घाऊक व्यापारी बिलिंग प्रणाली",
  invocation: "।। श्री गणेशाय नमः ।।",

  // मुख्य नेव्हिगेशन टॅब्स
  tabs: {
    home: "मुख्य",
    newBill: "नवीन बिल",
    bills: "बिले",
    vendors: "व्हेंडर्स",
    settings: "सेटिंग्ज",
  },

  // डॅशबोर्ड
  dashboard: {
    todaySales: "आजची विक्री",
    monthSales: "चालू महिना विक्री",
    totalBills: "एकूण बिले",
    totalVendors: "एकूण व्हेंडर्स",
    recentBills: "ताज्या बिलांचा तपशील",
    viewAll: "सर्व पहा",
    noRecentBills: "अद्याप कोणतीही बिले बनवली नाहीत.",
    quickActions: "जलद पर्याय",
  },

  // बिल बनवणे
  billing: {
    title: "नवीन घाऊक बिल बनवा",
    customerDetails: "ग्राहकाचा तपशील",
    customerName: "ग्राहकाचे नाव",
    customerNamePlaceholder: "उदा. रमेश किराणा स्टोअर्स",
    customerMobile: "ग्राहक मोबाइल नंबर",
    customerMobilePlaceholder: "उदा. ९८XXXXXXXX",
    billDate: "दिनांक",
    paymentMode: "देयक प्रकार",
    paymentCash: "रोख (Cash)",
    paymentCredit: "उधारी (Credit)",
    paymentOnline: "ऑनलाइन (UPI)",
    
    // आयटम तपशील
    itemsSection: "भाजीपाला मालाची यादी",
    addItem: "+ नवीन भाजी जोडा",
    itemName: "भाजीचे नाव",
    itemNamePlaceholder: "उदा. कांदा / बटाटा",
    selectVendor: "व्हेंडर / शेतकरी निवडा",
    selectVendorPlaceholder: "-- व्हेंडर निवडा --",
    unit: "एकक",
    quantity: "प्रमाण / वजन",
    rate: "दर प्रति एकक (₹)",
    amount: "एकूण रक्कम (₹)",
    removeItem: "काढून टाका",

    // हिशोब सारांश
    summarySection: "हिशोब सारांश",
    subtotal: "भाजीपाला एकूण:",
    transportCharges: "वाहतूक / हमाली खर्च (+):",
    discount: "दिलेली सूट / कपात (-):",
    grandTotal: "अंतिम एकूण रक्कम:",
    notes: "विशेष नोंद / शेरा",
    notesPlaceholder: "उदा. टेम्पोने माल पाठवला / अर्धी रक्कम जमा",

    saveBill: "बिल तयार करा व PDF मिळवा",
    saving: "बिल जतन होत आहे...",
    billSavedSuccess: "बिल यशस्वीरीत्या तयार झाले!",
  },

  // व्हेंडर व्यवस्थापन
  vendors: {
    title: "व्हेंडर व्यवस्थापन",
    searchPlaceholder: "व्हेंडरचे नाव किंवा फोन शोधा...",
    addVendor: "+ नवीन व्हेंडर जोडा",
    editVendor: "व्हेंडर माहिती बदला",
    deleteVendor: "व्हेंडर हटवा",
    vendorName: "व्हेंडरचे नाव",
    vendorNamePlaceholder: "उदा. आनंद भाजी मंडई (नाशिक)",
    mobile: "मोबाइल नंबर",
    mobilePlaceholder: "उदा. ९८२०१२३४५६",
    address: "पत्ता / मंडी / गाव",
    addressPlaceholder: "उदा. मार्केट यार्ड, गाळा नं. ५",
    notes: "विशेष शेरा / माहिती",
    notesPlaceholder: "उदा. बटाटा व कांदा पुरवठादार",
    save: "जतन करा",
    cancel: "रद्द करा",
    noVendorsFound: "कोणताही व्हेंडर सापडला नाही.",
    confirmDelete: "तुम्हाला हा व्हेंडर खरंच हटवायचा आहे का?",
    deleteWarning: "हा व्हेंडर हटवल्यास जुन्या बिलांमधील माहितीवर परिणाम होऊ शकतो.",
  },

  // बिले व इतिहास
  billsList: {
    title: "बिलांची यादी व इतिहास",
    searchPlaceholder: "ग्राहक नाव किंवा बिल क्र. शोधा...",
    billNo: "बिल क्र.",
    date: "दिनांक",
    customer: "ग्राहक",
    totalAmount: "एकूण",
    status: "स्थिती",
    actions: "कृती",
    viewBill: "तपशील पहा",
    shareWhatsApp: "WhatsApp वर पाठवा",
    viewPdf: "PDF बिल",
    noBillsFound: "कोणतेही बिल सापडले नाही.",
  },

  // बिल तपशील
  billDetail: {
    title: "बिलाचा तपशील",
    billInfo: "बिल माहिती",
    itemsTable: "भाजीपाला व पुरवठादार तपशील",
    shareOnWhatsApp: "WhatsApp वर पाठवा",
    downloadPdf: "PDF डाउनलोड / प्रिंट",
    deleteBill: "बिल हटवा",
    confirmDeleteBill: "तुम्हाला हे बिल खरंच हटवायचे आहे का?",
  },

  // दुकान सेटिंग्ज
  settings: {
    title: "दुकान व व्यापारी प्रोफाईल",
    shopName: "दुकान / पेढीचे नाव",
    ownerName: "व्यापारी / मालकाचे नाव",
    mobile: "मोबाइल नंबर",
    address: "मार्केट यार्ड पत्ता",
    tagline: "घोषवाक्य / व्यवसायाचे स्वरूप",
    upiId: "UPI आयडी (ऑनलाइन पेमेंटसाठी)",
    terms: "बिलावरील नियम व अटी",
    serverUrl: "बॅकएंड सर्व्हर पत्ता (API URL)",
    serverUrlHint: "स्थानिक नेटवर्क किंवा मोबाईलनंतर IP पत्ता बदला (उदा. http://192.168.1.10:8000)",
    saveSettings: "माहिती जतन करा",
    settingsSaved: "सेटिंग्ज यशस्वीरीत्या अद्ययावत झाल्या!",
  },

  // भाज्यांची जलद यादी (Quick Vegetable Chips)
  commonVegetables: [
    "कांदा (लाल)",
    "कांदा (पांढरा)",
    "बटाटा",
    "टोमॅटो",
    "लसूण",
    "आले",
    "हिरवी मिरची",
    "कोथिंबीर",
    "मेथी",
    "पालक",
    "कोबी",
    "फ्लॉवर",
    "शिमला मिरची",
    "गाजर",
    "वांगी",
    "भेंडी",
    "काकडी",
    "दुधी भोपळा",
    "शेवगा शेंग",
    "मटार (वाटाणा)",
  ],

  // एकके (Units)
  units: [
    "किलो (Kg)",
    "क्विंटल (Qntl)",
    "पोते (Bag - 50kg)",
    "पोते (Bag - 40kg)",
    "क्रेट (Crate - 20kg)",
    "जुडी (Bundle)",
    "डझन (Dozen)",
    "ग्राम (Gram)",
  ],
};
