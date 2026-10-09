import { Linking, Platform } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { printBill, shareBillPdf, generateBillHtml } from "./billPdfService";

// Default API Base URL: points to the live Render cloud backend
let API_BASE_URL = "https://vegitables-billing-api.onrender.com";

export const getApiBaseUrl = () => API_BASE_URL;

export const setApiBaseUrl = (url) => {
  if (!url) return;
  let cleanUrl = url.trim();
  if (cleanUrl.endsWith("/")) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  API_BASE_URL = cleanUrl;
};

// Generic fetch wrapper with timeout and Marathi error handling
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMsg = `सर्व्हर त्रुटी (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson && errJson.detail) {
          errorMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch (e) {}
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    console.error(`API Error on ${endpoint}:`, error.message);
    if (
      error.name === "AbortError" ||
      (error.message && (error.message.includes("Network request failed") || error.message.includes("Failed to fetch")))
    ) {
      throw new Error(`सर्व्हरशी संपर्क होऊ शकला नाही (${API_BASE_URL}). कृपया संगणक आणि मोबाईल एकाच Wi-Fi वर आहेत का ते तपासा.`);
    }
    throw error;
  }
};

export const api = {
  // --- DASHBOARD (डॅशबोर्ड) ---
  getDashboard: () => apiRequest("/api/dashboard"),

  // --- VENDORS (व्हेंडर व्यवस्थापन) ---
  getVendors: () => apiRequest("/api/vendors"),
  getVendor: (id) => apiRequest(`/api/vendors/${id}`),
  createVendor: (vendorData) =>
    apiRequest("/api/vendors", {
      method: "POST",
      body: JSON.stringify(vendorData),
    }),
  updateVendor: (id, vendorData) =>
    apiRequest(`/api/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(vendorData),
    }),
  deleteVendor: (id) =>
    apiRequest(`/api/vendors/${id}`, {
      method: "DELETE",
    }),

  // --- BILLS (बिलिंग) ---
  getBills: (search = "") => {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest(`/api/bills${query}`);
  },
  getBill: (id) => apiRequest(`/api/bills/${id}`),
  createBill: (billData) =>
    apiRequest("/api/bills", {
      method: "POST",
      body: JSON.stringify(billData),
    }),
  deleteBill: (id) =>
    apiRequest(`/api/bills/${id}`, {
      method: "DELETE",
    }),

  // --- PDF & WHATSAPP SHARING (शेअरिंग) ---
  getPdfUrl: (billId) => `${API_BASE_URL}/api/bills/${billId}/pdf`,
  getWhatsAppLink: (billId) => apiRequest(`/api/bills/${billId}/whatsapp-link`),

  // Print Bill or Save as PDF using native Android print preview
  printBill: async (bill, settings = {}) => {
    return await printBill(bill, settings);
  },

  // Share PDF file directly via WhatsApp/Telegram/Drive
  sharePdf: async (bill, settings = {}) => {
    return await shareBillPdf(bill, settings);
  },

  // Open PDF in browser or download & share via native share sheet
  openPdf: async (billOrId, billNumber = "bill", settings = {}) => {
    // If full bill object is available, generate locally with 100% Devanagari text shaping
    if (typeof billOrId === "object" && billOrId !== null && billOrId.items) {
      return await printBill(billOrId, settings);
    }

    const billId = typeof billOrId === "object" ? billOrId.id : billOrId;
    const pdfUrl = `${API_BASE_URL}/api/bills/${billId}/pdf`;
    const htmlUrl = `${API_BASE_URL}/api/bills/${billId}/html`;
    const viewUrl = `${API_BASE_URL}/api/bills/${billId}/view`;

    try {
      if (Platform.OS === "web") {
        window.open(viewUrl, "_blank");
        return;
      }

      // 1. Try generating flawless native Android PDF via expo-print
      try {
        const htmlRes = await fetch(htmlUrl);
        if (htmlRes.ok) {
          const htmlContent = await htmlRes.text();
          if (htmlContent && htmlContent.includes("<html")) {
            await Print.printAsync({ html: htmlContent });
            return;
          }
        }
      } catch (localPrintErr) {
        console.warn("Local expo-print fallback:", localPrintErr);
      }

      // 2. Fallback: Download server PDF with safe ASCII filename
      const safeName = `bill_${billId}_${Date.now()}`;
      const fileUri = `${FileSystem.documentDirectory}${safeName}.pdf`;
      const downloadRes = await FileSystem.downloadAsync(pdfUrl, fileUri);
      
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadRes.uri, {
          mimeType: "application/pdf",
          dialogTitle: `मराठी बिल - ${billNumber}`,
          UTI: "com.adobe.pdf",
        });
      } else {
        await Linking.openURL(viewUrl);
      }
    } catch (err) {
      console.warn("PDF open error, opening fallback URL:", err);
      await Linking.openURL(viewUrl);
    }
  },

  // Direct WhatsApp share with message text
  shareToWhatsApp: async (billId) => {
    try {
      const data = await apiRequest(`/api/bills/${billId}/whatsapp-link`);
      if (data && data.whatsapp_url) {
        const canOpen = await Linking.canOpenURL(data.whatsapp_url);
        if (canOpen) {
          await Linking.openURL(data.whatsapp_url);
        } else {
          // Fallback to web WhatsApp
          await Linking.openURL(`https://web.whatsapp.com/send?text=${encodeURIComponent(data.message_text)}`);
        }
      }
    } catch (err) {
      console.error("WhatsApp share failed:", err);
      alert("WhatsApp वर पाठवताना समस्या आली: " + err.message);
    }
  },

  // --- SETTINGS (सेटिंग्ज) ---
  getSettings: () => apiRequest("/api/settings"),
  updateSettings: (settingsData) =>
    apiRequest("/api/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    }),

  // --- AUTH (ॲडमिन ऑथेंटिकेशन) ---
  login: (username, password) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  changePassword: (username, old_password, new_password) =>
    apiRequest("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ username, old_password, new_password }),
    }),
};
