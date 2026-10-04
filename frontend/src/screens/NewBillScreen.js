import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";
import { STRINGS } from "../constants/marathiStrings";
import { api } from "../services/api";

// Marathi Calendar and Payment constants
const MARATHI_MONTHS = [
  "जानेवारी", "फेब्रुवारी", "मार्च", "एप्रिल", "मे", "जून",
  "जुलै", "ऑगस्ट", "सप्टेंबर", "ऑक्टोबर", "नोव्हेंबर", "डिसेंबर"
];

const MARATHI_WEEKDAYS = ["रवि", "सोम", "मंगळ", "बुध", "गुरू", "शुक्र", "शनि"];

const PAYMENT_OPTIONS = [
  { id: "रोख", label: "रोख (Cash)", icon: "cash-multiple", desc: "रोख स्वरूपात जमा", color: "#2E7D32" },
  { id: "उधारी", label: "उधारी (Credit)", icon: "book-open-outline", desc: "खात्यावर उधारी नोंद", color: "#C62828" },
  { id: "ऑनलाइन", label: "ऑनलाइन (UPI / Online)", icon: "qrcode-scan", desc: "GooglePay, PhonePe, UPI", color: "#0277BD" },
  { id: "चेक", label: "बँक चेक (Cheque)", icon: "checkbook", desc: "बँक धनादेश", color: "#F57F17" },
];

export default function NewBillScreen({ onNavigate, onBillCreated }) {
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerMobile, setCustomerMobile] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentStatus, setPaymentStatus] = useState("रोख");
  const [transportCharges, setTransportCharges] = useState("0");
  const [discount, setDiscount] = useState("0");
  const [notes, setNotes] = useState("");

  // Calendar Popup Modal States
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());

  // Payment Dropdown Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Items State (Dynamic array)
  const [items, setItems] = useState([
    {
      id: "item_1",
      item_name: "कांदा (लाल)",
      vendor_id: null,
      vendor_name: "",
      unit: "पोते (Bag - 50kg)",
      quantity: "1",
      rate: "1000",
    },
  ]);

  // Modal States for Vendor Picker & Unit Picker
  const [activeItemIndex, setActiveItemIndex] = useState(null);
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false);

  // Success Modal
  const [createdBill, setCreatedBill] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoadingVendors(true);
      const data = await api.getVendors();
      setVendors(data);
      // Auto-assign first vendor to first item if available
      if (data && data.length > 0) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === 0 && !it.vendor_id
              ? { ...it, vendor_id: data[0].id, vendor_name: data[0].name }
              : it
          )
        );
      }
    } catch (err) {
      console.warn("Failed to load vendors:", err);
    } finally {
      setLoadingVendors(false);
    }
  };

  // Calendar & Date Helpers
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return `${d} ${MARATHI_MONTHS[m] || ""} ${y}`;
    }
    return dateStr;
  };

  const handleSelectDay = (day) => {
    const mm = String(calendarMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    setBillDate(`${calendarYear}-${mm}-${dd}`);
    setShowDatePicker(false);
  };

  const setTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    setCalendarYear(yyyy);
    setCalendarMonth(today.getMonth());
    setBillDate(`${yyyy}-${mm}-${dd}`);
    setShowDatePicker(false);
  };

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const nextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Dynamic Item actions
  const handleAddItem = () => {
    const newItem = {
      id: `item_${Date.now()}`,
      item_name: "",
      vendor_id: vendors.length > 0 ? vendors[0].id : null,
      vendor_name: vendors.length > 0 ? vendors[0].name : "",
      unit: "किलो (Kg)",
      quantity: "1",
      rate: "",
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      Alert.alert("सूचना", "बिलामध्ये किमान एक भाजी असणे आवश्यक आहे.");
      return;
    }
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
  };

  const updateItemField = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  // Calculations
  const calculateItemAmount = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    return qty * rate;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemAmount(item), 0);
  const transport = parseFloat(transportCharges) || 0;
  const disc = parseFloat(discount) || 0;
  const grandTotal = Math.max(0, subtotal + transport - disc);

  // Submit Bill
  const handleSaveBill = async () => {
    if (!customerName.trim()) {
      Alert.alert("अपूर्ण माहिती", "कृपया ग्राहकाचे नाव प्रविष्ट करा.");
      return;
    }

    // Validate items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.item_name.trim()) {
        Alert.alert("अपूर्ण माहिती", `भाजी क्र. ${i + 1} चे नाव प्रविष्ट करा.`);
        return;
      }
      if (!it.quantity || parseFloat(it.quantity) <= 0) {
        Alert.alert("अपूर्ण माहिती", `भाजी क्र. ${i + 1} चे प्रमाण (वजन) शून्य नसावे.`);
        return;
      }
      if (!it.rate || parseFloat(it.rate) <= 0) {
        Alert.alert("अपूर्ण माहिती", `भाजी क्र. ${i + 1} चा दर प्रविष्ट करा.`);
        return;
      }
    }

    const payload = {
      customer_name: customerName.trim(),
      customer_mobile: customerMobile.trim(),
      bill_date: billDate,
      payment_status: paymentStatus,
      transport_charges: transport,
      discount: disc,
      notes: notes.trim(),
      items: items.map((it) => ({
        vendor_id: it.vendor_id || null,
        item_name: it.item_name.trim(),
        unit: it.unit,
        quantity: parseFloat(it.quantity),
        rate: parseFloat(it.rate),
      })),
    };

    try {
      setSubmitting(true);
      const res = await api.createBill(payload);
      setCreatedBill(res);
      setShowSuccessModal(true);
      if (onBillCreated) onBillCreated(res);
    } catch (err) {
      Alert.alert("त्रुटी", err.message || "बिल तयार करताना समस्या आली.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCustomerName("");
    setCustomerMobile("");
    setNotes("");
    setTransportCharges("0");
    setDiscount("0");
    setItems([
      {
        id: `item_${Date.now()}`,
        item_name: "कांदा (लाल)",
        vendor_id: vendors.length > 0 ? vendors[0].id : null,
        vendor_name: vendors.length > 0 ? vendors[0].name : "",
        unit: "पोते (Bag - 50kg)",
        quantity: "1",
        rate: "1000",
      },
    ]);
    setShowSuccessModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Title */}
        <View style={styles.titleRow}>
          <FontAwesome5 name="file-invoice-dollar" size={22} color={COLORS.primary} />
          <Text style={styles.titleText}>{STRINGS.billing.title}</Text>
        </View>

        {/* 1. Customer Details Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>{STRINGS.billing.customerDetails}</Text>

          <Text style={styles.inputLabel}>{STRINGS.billing.customerName} *</Text>
          <TextInput
            style={styles.input}
            placeholder={STRINGS.billing.customerNamePlaceholder}
            placeholderTextColor={COLORS.textMuted}
            value={customerName}
            onChangeText={setCustomerName}
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>{STRINGS.billing.customerMobile}</Text>
              <TextInput
                style={styles.input}
                placeholder={STRINGS.billing.customerMobilePlaceholder}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="phone-pad"
                value={customerMobile}
                onChangeText={setCustomerMobile}
              />
            </View>

            {/* Date with Calendar Popup */}
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>{STRINGS.billing.billDate} *</Text>
              <TouchableOpacity
                style={styles.dropdownBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.dropdownBtnText} numberOfLines={1}>
                  {formatDisplayDate(billDate)}
                </Text>
                <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Payment Status Dropdown Selector */}
          <Text style={styles.inputLabel}>{STRINGS.billing.paymentMode} (ड्रॉपडाउन) *</Text>
          <TouchableOpacity
            style={styles.dropdownBtn}
            onPress={() => setShowPaymentModal(true)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <MaterialCommunityIcons
                name={
                  PAYMENT_OPTIONS.find((p) => p.id === paymentStatus)?.icon || "cash-multiple"
                }
                size={18}
                color={
                  PAYMENT_OPTIONS.find((p) => p.id === paymentStatus)?.color || COLORS.primary
                }
                style={{ marginRight: 8 }}
              />
              <Text style={styles.dropdownBtnText}>
                {PAYMENT_OPTIONS.find((p) => p.id === paymentStatus)?.label || paymentStatus}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* 2. Items List Section */}
        <View style={styles.card}>
          <View style={styles.itemsHeaderRow}>
            <Text style={styles.cardHeader}>{STRINGS.billing.itemsSection}</Text>
            <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem}>
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addItemBtnText}>नवीन भाजी जोडा</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => {
            const itemTotal = calculateItemAmount(item);
            return (
              <View key={item.id} style={styles.itemBox}>
                <View style={styles.itemBoxHeader}>
                  <Text style={styles.itemIndexBadge}>भाजी क्र. {index + 1}</Text>
                  {items.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveItem(index)}
                      style={styles.removeItemBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                      <Text style={styles.removeItemText}>{STRINGS.billing.removeItem}</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Item Name Input */}
                <Text style={styles.inputLabel}>{STRINGS.billing.itemName} *</Text>
                <TextInput
                  style={styles.input}
                  placeholder={STRINGS.billing.itemNamePlaceholder}
                  placeholderTextColor={COLORS.textMuted}
                  value={item.item_name}
                  onChangeText={(val) => updateItemField(index, "item_name", val)}
                />

                {/* Quick Vegetable Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                  {STRINGS.commonVegetables.slice(0, 10).map((veg) => (
                    <TouchableOpacity
                      key={veg}
                      style={styles.vegChip}
                      onPress={() => updateItemField(index, "item_name", veg)}
                    >
                      <Text style={styles.vegChipText}>+ {veg}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Vendor Dropdown Selector (Multiple Vendors Support) */}
                <Text style={styles.inputLabel}>{STRINGS.billing.selectVendor}</Text>
                <TouchableOpacity
                  style={styles.dropdownBtn}
                  onPress={() => {
                    setActiveItemIndex(index);
                    setShowVendorModal(true);
                  }}
                >
                  <FontAwesome5 name="store" size={14} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.dropdownBtnText} numberOfLines={1}>
                    {item.vendor_name || STRINGS.billing.selectVendorPlaceholder}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
                </TouchableOpacity>

                {/* Unit, Qty, Rate Row */}
                <View style={styles.row}>
                  {/* Unit Selector */}
                  <View style={{ flex: 1.2, marginRight: 6 }}>
                    <Text style={styles.inputLabel}>{STRINGS.billing.unit}</Text>
                    <TouchableOpacity
                      style={styles.dropdownBtnSmall}
                      onPress={() => {
                        setActiveItemIndex(index);
                        setShowUnitModal(true);
                      }}
                    >
                      <Text style={styles.dropdownBtnSmallText} numberOfLines={1}>
                        {item.unit}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  {/* Quantity */}
                  <View style={{ flex: 1, marginRight: 6 }}>
                    <Text style={styles.inputLabel}>प्रमाण *</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.quantity}
                      onChangeText={(val) => updateItemField(index, "quantity", val)}
                      placeholder="१"
                    />
                  </View>

                  {/* Rate */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>दर (₹) *</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={item.rate}
                      onChangeText={(val) => updateItemField(index, "rate", val)}
                      placeholder="५०"
                    />
                  </View>
                </View>

                {/* Sub-Amount Banner */}
                <View style={styles.itemAmountBox}>
                  <Text style={styles.itemAmountLabel}>या भाजीची एकूण रक्कम:</Text>
                  <Text style={styles.itemAmountValue}>
                    ₹ {Number(itemTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              </View>
            );
          })}

          <TouchableOpacity style={styles.addMoreBtn} onPress={handleAddItem}>
            <Ionicons name="add" size={20} color={COLORS.primary} />
            <Text style={styles.addMoreBtnText}>आणखी भाजी जोडा</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Summary & Extra Charges */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>{STRINGS.billing.summarySection}</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{STRINGS.billing.subtotal}</Text>
            <Text style={styles.summaryValue}>₹ {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
          </View>

          <View style={styles.summaryInputRow}>
            <Text style={styles.summaryInputLabel}>{STRINGS.billing.transportCharges}</Text>
            <View style={styles.currencyInputWrap}>
              <Text style={styles.rupeePrefix}>₹</Text>
              <TextInput
                style={styles.currencyInput}
                keyboardType="numeric"
                value={transportCharges}
                onChangeText={setTransportCharges}
              />
            </View>
          </View>

          <View style={styles.summaryInputRow}>
            <Text style={[styles.summaryInputLabel, { color: COLORS.danger }]}>{STRINGS.billing.discount}</Text>
            <View style={styles.currencyInputWrap}>
              <Text style={[styles.rupeePrefix, { color: COLORS.danger }]}>₹</Text>
              <TextInput
                style={[styles.currencyInput, { color: COLORS.danger }]}
                keyboardType="numeric"
                value={discount}
                onChangeText={setDiscount}
              />
            </View>
          </View>

          <View style={styles.grandTotalBox}>
            <Text style={styles.grandTotalLabel}>{STRINGS.billing.grandTotal}</Text>
            <Text style={styles.grandTotalValue}>
              ₹ {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </Text>
          </View>

          {/* Notes Input */}
          <Text style={[styles.inputLabel, { marginTop: 12 }]}>{STRINGS.billing.notes}</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: "top" }]}
            placeholder={STRINGS.billing.notesPlaceholder}
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={2}
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSaveBill}
          disabled={submitting}
          activeOpacity={0.88}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="content-save-check" size={24} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>{STRINGS.billing.saveBill}</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* --- VENDOR PICKER MODAL --- */}
      <Modal visible={showVendorModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>व्हेंडर / शेतकरी निवडा</Text>
              <TouchableOpacity onPress={() => setShowVendorModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {loadingVendors ? (
              <ActivityIndicator size="large" color={COLORS.primary} style={{ margin: 20 }} />
            ) : vendors.length === 0 ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <Text style={{ color: COLORS.textSecondary, marginBottom: 12 }}>अद्याप कोणताही व्हेंडर जोडलेला नाही.</Text>
                <TouchableOpacity
                  style={[styles.addItemBtn, { alignSelf: "center" }]}
                  onPress={() => {
                    setShowVendorModal(false);
                    onNavigate("vendors");
                  }}
                >
                  <Text style={styles.addItemBtnText}>+ नवीन व्हेंडर जोडा</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={vendors}
                keyExtractor={(item) => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => {
                      if (activeItemIndex !== null) {
                        updateItemField(activeItemIndex, "vendor_id", item.id);
                        updateItemField(activeItemIndex, "vendor_name", item.name);
                      }
                      setShowVendorModal(false);
                    }}
                  >
                    <FontAwesome5 name="store" size={16} color={COLORS.primary} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.modalItemName}>{item.name}</Text>
                      {item.address ? (
                        <Text style={styles.modalItemSub}>{item.address}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.border} />
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* --- UNIT PICKER MODAL --- */}
      <Modal visible={showUnitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>एकक निवडा (Unit)</Text>
              <TouchableOpacity onPress={() => setShowUnitModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={STRINGS.units}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    if (activeItemIndex !== null) {
                      updateItemField(activeItemIndex, "unit", item);
                    }
                    setShowUnitModal(false);
                  }}
                >
                  <Text style={styles.modalItemName}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* --- MARATHI CALENDAR POPUP MODAL --- */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: 360, padding: 14 }]}>
            {/* Header with Month/Year Navigation */}
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={prevMonth} style={styles.calNavBtn}>
                <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.calMonthTitle}>
                {MARATHI_MONTHS[calendarMonth]} {calendarYear}
              </Text>
              <TouchableOpacity onPress={nextMonth} style={styles.calNavBtn}>
                <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {/* Weekdays Row */}
            <View style={styles.calWeekRow}>
              {MARATHI_WEEKDAYS.map((w) => (
                <Text key={w} style={styles.calWeekText}>{w}</Text>
              ))}
            </View>

            {/* Days Grid */}
            <View style={styles.calDaysGrid}>
              {/* Empty leading cells for first day of month */}
              {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }).map((_, idx) => (
                <View key={`empty_${idx}`} style={styles.calDayCell} />
              ))}
              {/* Day cells */}
              {Array.from({ length: new Date(calendarYear, calendarMonth + 1, 0).getDate() }).map((_, idx) => {
                const day = idx + 1;
                const mm = String(calendarMonth + 1).padStart(2, "0");
                const dd = String(day).padStart(2, "0");
                const fullStr = `${calendarYear}-${mm}-${dd}`;
                const isSelected = billDate === fullStr;
                return (
                  <TouchableOpacity
                    key={`day_${day}`}
                    style={[styles.calDayCell, isSelected && styles.calDayCellSelected]}
                    onPress={() => handleSelectDay(day)}
                  >
                    <Text style={[styles.calDayText, isSelected && styles.calDayTextSelected]}>
                      {day}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Quick Actions */}
            <View style={styles.calActionsRow}>
              <TouchableOpacity style={styles.calTodayBtn} onPress={setTodayDate}>
                <Ionicons name="today-outline" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.calTodayBtnText}>आजची तारीख (Today)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.calCloseBtn} onPress={() => setShowDatePicker(false)}>
                <Text style={styles.calCloseBtnText}>रद्द करा</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* --- PAYMENT MODE DROPDOWN MODAL --- */}
      <Modal visible={showPaymentModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxWidth: 360 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>देयक प्रकार निवडा (Payment Mode)</Text>
              <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            {PAYMENT_OPTIONS.map((opt) => {
              const isSelected = paymentStatus === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.paymentModalItem, isSelected && styles.paymentModalItemSelected]}
                  onPress={() => {
                    setPaymentStatus(opt.id);
                    setShowPaymentModal(false);
                  }}
                >
                  <View style={[styles.paymentIconBox, { backgroundColor: opt.color + "1A" }]}>
                    <MaterialCommunityIcons name={opt.icon} size={22} color={opt.color} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.paymentItemTitle, isSelected && { color: COLORS.primary, fontWeight: "bold" }]}>
                      {opt.label}
                    </Text>
                    <Text style={styles.paymentItemSub}>{opt.desc}</Text>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* --- SUCCESS MODAL --- */}
      <Modal visible={showSuccessModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { alignItems: "center" }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>बिल यशस्वीरीत्या तयार झाले!</Text>
            <Text style={styles.successSub}>
              {createdBill ? `बिल क्र: ${createdBill.bill_number}` : ""}
            </Text>
            <Text style={styles.successAmount}>
              ₹ {createdBill ? Number(createdBill.grand_total).toLocaleString("en-IN") : ""}
            </Text>

            {/* Action Buttons */}
            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: COLORS.whatsapp }]}
              onPress={() => {
                if (createdBill) api.shareToWhatsApp(createdBill.id);
              }}
            >
              <FontAwesome5 name="whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.modalActionBtnText}>WhatsApp वर पाठवा</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalActionBtn, { backgroundColor: "#C62828" }]}
              onPress={() => {
                if (createdBill) api.openPdf(createdBill.id, createdBill.bill_number);
              }}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.modalActionBtnText}>PDF बिल पहा व प्रिंट करा</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.modalOutlineBtn, { flex: 1, marginRight: 6 }]}
                onPress={() => {
                  setShowSuccessModal(false);
                  onNavigate("bills");
                }}
              >
                <Text style={styles.modalOutlineBtnText}>बिले यादी पहा</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalOutlineBtn, { flex: 1, backgroundColor: COLORS.surfaceVariant }]}
                onPress={resetForm}
              >
                <Text style={[styles.modalOutlineBtnText, { color: COLORS.primary }]}>+ दुसरे बिल बनवा</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 12,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginLeft: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
    paddingBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: 6,
  },
  input: {
    backgroundColor: "#F9FBF9",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  paymentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  paymentPill: {
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#F9FBF9",
  },
  paymentPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  paymentPillText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  paymentPillTextActive: {
    color: "#FFFFFF",
  },
  itemsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addItemBtnText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "bold",
    marginLeft: 4,
  },
  itemBox: {
    backgroundColor: "#FBFDFB",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginTop: 10,
  },
  itemBoxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  itemIndexBadge: {
    backgroundColor: COLORS.surfaceVariant,
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 11.5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  removeItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 2,
  },
  removeItemText: {
    color: COLORS.danger,
    fontSize: 11.5,
    marginLeft: 4,
  },
  chipsScroll: {
    marginVertical: 6,
  },
  vegChip: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vegChipText: {
    fontSize: 11.5,
    color: COLORS.primary,
  },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FBF9",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownBtnText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  dropdownBtnSmall: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FBF9",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  dropdownBtnSmallText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  itemAmountBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  itemAmountLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  itemAmountValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceVariant,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
  },
  addMoreBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 6,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  summaryInputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  summaryInputLabel: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  currencyInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FBF9",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    width: 110,
  },
  rupeePrefix: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.textPrimary,
    paddingVertical: 4,
    textAlign: "right",
  },
  grandTotalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  grandTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 20,
    ...SHADOWS.md,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    width: "100%",
    maxWidth: 420,
    maxHeight: "80%",
    padding: 16,
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 10,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  modalItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  modalItemSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  successSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  successAmount: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.primary,
    marginVertical: 10,
  },
  modalActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalActionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  modalOutlineBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  modalOutlineBtnText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  // Calendar Modal Styles
  calHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  calNavBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceVariant,
  },
  calMonthTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  calWeekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    marginBottom: 6,
  },
  calWeekText: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.textSecondary,
  },
  calDaysGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  calDayCell: {
    width: "14.28%",
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
    borderRadius: 8,
  },
  calDayCellSelected: {
    backgroundColor: COLORS.primary,
  },
  calDayText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: "500",
  },
  calDayTextSelected: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  calActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  calTodayBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: 6,
  },
  calTodayBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "bold",
  },
  calCloseBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  calCloseBtnText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  // Payment Dropdown Modal Styles
  paymentModalItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    backgroundColor: "#FBFDFB",
  },
  paymentModalItemSelected: {
    backgroundColor: COLORS.surfaceVariant,
    borderColor: COLORS.primary,
  },
  paymentIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentItemTitle: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  paymentItemSub: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
