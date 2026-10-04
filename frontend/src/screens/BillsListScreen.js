import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";
import { STRINGS } from "../constants/marathiStrings";
import { api } from "../services/api";

export default function BillsListScreen({ onSelectBill, onNavigate }) {
  const [bills, setBills] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBills = useCallback(async (search = "") => {
    try {
      setLoading(true);
      const data = await api.getBills(search);
      setBills(data);
    } catch (err) {
      console.warn("Failed to load bills:", err);
      Alert.alert("त्रुटी", "बिलांची यादी आणता आली नाही.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadBills();
  }, [loadBills]);

  // Handle Search submit / debounce
  const handleSearch = () => {
    loadBills(searchQuery);
  };

  const handleDeleteBill = (bill) => {
    const doDelete = async () => {
      try {
        await api.deleteBill(bill.id);
        loadBills(searchQuery);
      } catch (err) {
        Alert.alert("त्रुटी", err.message || "बिल हटवता आले नाही.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`तुम्हाला '${bill.bill_number}' हे बिल खरंच हटवायचे आहे का?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        "बिल हटवा",
        `तुम्हाला '${bill.bill_number}' (${bill.customer_name}) हे बिल खरंच हटवायचे आहे का?`,
        [
          { text: "रद्द करा", style: "cancel" },
          { text: "हटवा", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="clipboard-text-clock" size={22} color={COLORS.primary} />
          <Text style={styles.titleText}>{STRINGS.billsList.title}</Text>
        </View>

        <TouchableOpacity style={styles.newBillBtn} onPress={() => onNavigate("newBill")}>
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.newBillBtnText}>नवीन बिल</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={STRINGS.billsList.searchPlaceholder}
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              loadBills("");
            }}
          >
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Bills List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadBills(searchQuery);
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="file-document-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{STRINGS.billsList.noBillsFound}</Text>
              <TouchableOpacity
                style={styles.createFirstBtn}
                onPress={() => onNavigate("newBill")}
              >
                <Text style={styles.createFirstBtnText}>+ नवीन बिल तयार करा</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.billCard}
              activeOpacity={0.92}
              onPress={() => onSelectBill(item.id)}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerName}>{item.customer_name}</Text>
                  <Text style={styles.billMeta}>
                    {item.bill_number} • {item.bill_date}
                  </Text>
                </View>

                <View style={styles.amountCol}>
                  <Text style={styles.grandTotalText}>
                    ₹ {Number(item.grand_total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          item.payment_status === "रोख"
                            ? "#E8F5E9"
                            : item.payment_status === "उधारी"
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
                            item.payment_status === "रोख"
                              ? COLORS.success
                              : item.payment_status === "उधारी"
                              ? COLORS.danger
                              : COLORS.info,
                        },
                      ]}
                    >
                      {item.payment_status}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Items Summary snippet */}
              <View style={styles.itemSummaryRow}>
                <Ionicons name="basket-outline" size={14} color={COLORS.textSecondary} />
                <Text style={styles.itemSummaryText}>
                  {item.items && item.items.length > 0
                    ? `${item.items.length} भाजी प्रकार: ` +
                      item.items
                        .slice(0, 3)
                        .map((i) => i.item_name)
                        .join(", ") +
                      (item.items.length > 3 ? "..." : "")
                    : "मालाची माहिती उपलब्ध नाही"}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDeleteBill(item);
                  }}
                >
                  <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.detailBtn]}
                  onPress={(e) => {
                    e.stopPropagation();
                    onSelectBill(item.id);
                  }}
                >
                  <Ionicons name="eye-outline" size={15} color={COLORS.primary} />
                  <Text style={styles.detailBtnText}>तपशील</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.pdfBtn]}
                  onPress={(e) => {
                    e.stopPropagation();
                    api.openPdf(item.id, item.bill_number);
                  }}
                >
                  <MaterialCommunityIcons name="file-pdf-box" size={16} color="#C62828" />
                  <Text style={styles.pdfBtnText}>PDF</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.whatsappBtn]}
                  onPress={(e) => {
                    e.stopPropagation();
                    api.shareToWhatsApp(item.id);
                  }}
                >
                  <FontAwesome5 name="whatsapp" size={15} color="#FFFFFF" />
                  <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
    marginLeft: 8,
  },
  newBillBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentOrange,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    ...SHADOWS.sm,
  },
  newBillBtnText: {
    color: "#FFFFFF",
    fontSize: 12.5,
    fontWeight: "bold",
    marginLeft: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: 14,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 30,
  },
  billCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  customerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  billMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  grandTotalText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  itemSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingVertical: 4,
  },
  itemSummaryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 6,
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    marginLeft: 6,
  },
  deleteBtn: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
  },
  detailBtn: {
    backgroundColor: COLORS.surfaceVariant,
  },
  detailBtnText: {
    fontSize: 11.5,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: "600",
  },
  pdfBtn: {
    backgroundColor: "#FFEBEE",
  },
  pdfBtnText: {
    fontSize: 11.5,
    color: "#C62828",
    marginLeft: 4,
    fontWeight: "bold",
  },
  whatsappBtn: {
    backgroundColor: COLORS.whatsapp,
  },
  whatsappBtnText: {
    fontSize: 11.5,
    color: "#FFFFFF",
    marginLeft: 4,
    fontWeight: "bold",
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 10,
    marginBottom: 14,
  },
  createFirstBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createFirstBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
});
