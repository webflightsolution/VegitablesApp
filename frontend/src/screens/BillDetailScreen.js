import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";
import { STRINGS } from "../constants/marathiStrings";
import { api } from "../services/api";

export default function BillDetailScreen({ billId, onBack, onBillDeleted }) {
  const [bill, setBill] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBill();
  }, [billId]);

  const loadBill = async () => {
    try {
      setLoading(true);
      const [billData, settingsData] = await Promise.allSettled([
        api.getBill(billId),
        api.getSettings(),
      ]);
      if (billData.status === "fulfilled") setBill(billData.value);
      if (settingsData.status === "fulfilled") setSettings(settingsData.value);
    } catch (err) {
      console.warn("Failed to load bill:", err);
      Alert.alert("त्रुटी", "बिलाचा तपशील आणता आला नाही.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!bill) return;
    try {
      setActionLoading(true);
      await api.printBill(bill, settings || {});
    } catch (err) {
      console.warn("Print error:", err);
      Alert.alert("प्रिंट त्रुटी", err.message || "बिल प्रिंट करता आले नाही.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSharePdf = async () => {
    if (!bill) return;
    try {
      setActionLoading(true);
      await api.sharePdf(bill, settings || {});
    } catch (err) {
      console.warn("Share PDF error:", err);
      Alert.alert("शेअर त्रुटी", err.message || "PDF शेअर करता आली नाही.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        await api.deleteBill(billId);
        if (onBillDeleted) onBillDeleted();
        onBack();
      } catch (err) {
        Alert.alert("त्रुटी", err.message || "बिल हटवता आले नाही.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm("तुम्हाला हे बिल खरंच हटवायचे आहे का?")) {
        doDelete();
      }
    } else {
      Alert.alert(
        STRINGS.billDetail.deleteBill,
        STRINGS.billDetail.confirmDeleteBill,
        [
          { text: "रद्द करा", style: "cancel" },
          { text: "हटवा", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!bill) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>बिल सापडले नाही.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>मागे जा</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Top Bar with Back Button */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backIconBtn} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={COLORS.primary} />
          <Text style={styles.backIconText}>मागे</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteHeaderBtn} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>

      {/* Bill Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.badgeRow}>
          <View style={styles.billNumberBadge}>
            <Text style={styles.billNumberText}>{bill.bill_number}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  bill.payment_status === "रोख"
                    ? "#E8F5E9"
                    : bill.payment_status === "उधारी"
                    ? "#FFEBEE"
                    : "#E3F2FD",
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color:
                    bill.payment_status === "रोख"
                      ? COLORS.success
                      : bill.payment_status === "उधारी"
                      ? COLORS.danger
                      : COLORS.info,
                },
              ]}
            >
              {bill.payment_status}
            </Text>
          </View>
        </View>

        <Text style={styles.customerName}>{bill.customer_name}</Text>
        {bill.customer_mobile ? (
          <View style={styles.metaRow}>
            <Ionicons name="call-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>{bill.customer_mobile}</Text>
          </View>
        ) : null}

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>दिनांक: {bill.bill_date}</Text>
        </View>
      </View>

      {/* Action Buttons: Print PDF, Share PDF & WhatsApp */}
      <View style={styles.actionButtonsWrap}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.halfActionBtn, { backgroundColor: "#C62828" }]}
            onPress={handlePrint}
            activeOpacity={0.85}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="file-pdf-box" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.halfActionBtnText}>PDF पहा / प्रिंट</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.halfActionBtn, { backgroundColor: COLORS.primary }]}
            onPress={handleSharePdf}
            activeOpacity={0.85}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="share-variant" size={19} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.halfActionBtnText}>PDF शेअर करा</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.bigActionBtn, { backgroundColor: COLORS.whatsapp }]}
          onPress={() => api.shareToWhatsApp(bill.id)}
          activeOpacity={0.88}
        >
          <FontAwesome5 name="whatsapp" size={19} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.bigActionBtnText}>WhatsApp वर मेसेज पाठवा</Text>
        </TouchableOpacity>
      </View>

      {/* Items Details Table */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{STRINGS.billDetail.itemsTable}</Text>

        {bill.items && bill.items.length > 0 ? (
          bill.items.map((it, idx) => (
            <View key={it.id || idx} style={styles.itemRowCard}>
              <View style={styles.itemRowTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemNameText}>{it.item_name}</Text>
                  <View style={styles.vendorTagRow}>
                    <FontAwesome5 name="store" size={11} color={COLORS.primary} />
                    <Text style={styles.vendorTagText}>
                      व्हेंडर: {it.vendor_name || "सामाईक/इतर"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.itemAmountText}>
                  ₹ {Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Text>
              </View>

              <View style={styles.itemRowBottom}>
                <Text style={styles.itemRateUnit}>
                  प्रमाण: {it.quantity} {it.unit} • दर: ₹{it.rate}/{it.unit}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noItemsText}>भाजीपाला माहिती उपलब्ध नाही.</Text>
        )}
      </View>

      {/* Totals Summary */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>हिशोब तपशील</Text>

        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>{STRINGS.billing.subtotal}</Text>
          <Text style={styles.calcVal}>₹ {bill.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
        </View>

        {bill.transport_charges > 0 && (
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>{STRINGS.billing.transportCharges}</Text>
            <Text style={styles.calcVal}>+ ₹ {bill.transport_charges.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
          </View>
        )}

        {bill.discount > 0 && (
          <View style={styles.calcRow}>
            <Text style={[styles.calcLabel, { color: COLORS.danger }]}>{STRINGS.billing.discount}</Text>
            <Text style={[styles.calcVal, { color: COLORS.danger }]}>- ₹ {bill.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
          </View>
        )}

        <View style={styles.grandTotalBanner}>
          <Text style={styles.grandTotalBannerLabel}>{STRINGS.billing.grandTotal}</Text>
          <Text style={styles.grandTotalBannerVal}>
            ₹ {bill.grand_total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </Text>
        </View>

        {bill.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>नोंद / शेरा:</Text>
            <Text style={styles.notesBody}>{bill.notes}</Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 14,
    paddingBottom: 40,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  backIconBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backIconText: {
    fontSize: 13,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: "bold",
  },
  deleteHeaderBtn: {
    padding: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  billNumberBadge: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  billNumberText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  customerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
  },
  metaText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  actionButtonsWrap: {
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  halfActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    ...SHADOWS.sm,
  },
  halfActionBtnText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "bold",
  },
  bigActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 8,
    ...SHADOWS.sm,
  },
  bigActionBtnText: {
    color: "#FFFFFF",
    fontSize: 14.5,
    fontWeight: "bold",
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
  cardTitle: {
    fontSize: 14.5,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
    paddingBottom: 6,
  },
  itemRowCard: {
    backgroundColor: "#FBFDFB",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  itemNameText: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  vendorTagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  vendorTagText: {
    fontSize: 11.5,
    color: COLORS.primary,
    marginLeft: 4,
  },
  itemAmountText: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  itemRowBottom: {
    marginTop: 6,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  itemRateUnit: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  calcRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  calcLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  calcVal: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textPrimary,
  },
  grandTotalBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  grandTotalBannerLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  grandTotalBannerVal: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  notesBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#F9FBF9",
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notesTitle: {
    fontSize: 11.5,
    fontWeight: "bold",
    color: COLORS.textSecondary,
  },
  notesBody: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  errorText: {
    fontSize: 15,
    color: COLORS.danger,
    marginBottom: 14,
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  noItemsText: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginVertical: 8,
  },
});
