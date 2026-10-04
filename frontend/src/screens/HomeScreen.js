import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";
import { STRINGS } from "../constants/marathiStrings";
import { api } from "../services/api";

export default function HomeScreen({ onNavigate, onSelectBill }) {
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const [dashData, shopSettings] = await Promise.all([
        api.getDashboard(),
        api.getSettings(),
      ]);
      setStats(dashData);
      setSettings(shopSettings);
    } catch (err) {
      setError("डेटा आणताना अडचण आली. कृपया सर्व्हर तपासा.");
      console.warn("Dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const todayDateFormatted = new Date().toLocaleDateString("mr-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* 1. Header Banner */}
      <View style={styles.headerCard}>
        <View style={styles.invocationRow}>
          <Text style={styles.invocationText}>{STRINGS.invocation}</Text>
        </View>
        <Text style={styles.shopName}>
          {settings ? settings.shop_name : "भाजीपाला घाऊक बिलिंग"}
        </Text>
        <Text style={styles.tagline}>
          {settings ? settings.tagline : "सर्व प्रकारच्या ताज्या भाजीपाल्याचे घाऊक व्यापारी"}
        </Text>
        <View style={styles.dateBadge}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.surfaceVariant} />
          <Text style={styles.dateText}>{todayDateFormatted}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={20} color={COLORS.danger} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryText}>पुन्हा प्रयत्न करा</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* 2. Quick Action - Create Bill */}
      <TouchableOpacity
        style={styles.newBillHeroBtn}
        onPress={() => onNavigate("newBill")}
        activeOpacity={0.88}
      >
        <View style={styles.newBillHeroIconBox}>
          <MaterialCommunityIcons name="plus-circle" size={32} color="#FFFFFF" />
        </View>
        <View style={styles.newBillHeroContent}>
          <Text style={styles.newBillHeroTitle}>नवीन घाऊक बिल बनवा</Text>
          <Text style={styles.newBillHeroSub}>ग्राहकाचे नाव, भाजीपाला आणि व्हेंडर निवडून बिल बनवा</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 3. Stat Cards Grid */}
      <Text style={styles.sectionTitle}>आजची सांख्यिकी व सारांश</Text>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 20 }} />
      ) : (
        <View style={styles.statsGrid}>
          {/* Today's Sales */}
          <View style={[styles.statCard, { borderLeftColor: COLORS.primary }]}>
            <View style={[styles.statIconBox, { backgroundColor: "#E8F5E9" }]}>
              <MaterialCommunityIcons name="cash-multiple" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.statLabel}>{STRINGS.dashboard.todaySales}</Text>
            <Text style={styles.statValue}>
              ₹ {stats ? Number(stats.total_sales_today).toLocaleString("en-IN") : "०"}
            </Text>
          </View>

          {/* Monthly Sales */}
          <View style={[styles.statCard, { borderLeftColor: COLORS.accent }]}>
            <View style={[styles.statIconBox, { backgroundColor: "#FFF8E1" }]}>
              <MaterialCommunityIcons name="chart-line" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.statLabel}>{STRINGS.dashboard.monthSales}</Text>
            <Text style={styles.statValue}>
              ₹ {stats ? Number(stats.total_sales_month).toLocaleString("en-IN") : "०"}
            </Text>
          </View>

          {/* Total Bills */}
          <View style={[styles.statCard, { borderLeftColor: COLORS.info }]}>
            <View style={[styles.statIconBox, { backgroundColor: "#E1F5FE" }]}>
              <MaterialCommunityIcons name="file-document-outline" size={24} color={COLORS.info} />
            </View>
            <Text style={styles.statLabel}>{STRINGS.dashboard.totalBills}</Text>
            <Text style={styles.statValue}>{stats ? stats.total_bills_count : 0}</Text>
          </View>

          {/* Total Vendors */}
          <View style={[styles.statCard, { borderLeftColor: COLORS.whatsappDark }]}>
            <View style={[styles.statIconBox, { backgroundColor: "#E0F2F1" }]}>
              <FontAwesome5 name="users" size={20} color={COLORS.whatsappDark} />
            </View>
            <Text style={styles.statLabel}>{STRINGS.dashboard.totalVendors}</Text>
            <Text style={styles.statValue}>{stats ? stats.total_vendors_count : 0}</Text>
          </View>
        </View>
      )}

      {/* 4. Quick Nav Options */}
      <View style={styles.quickNavRow}>
        <TouchableOpacity
          style={styles.quickNavBtn}
          onPress={() => onNavigate("vendors")}
        >
          <FontAwesome5 name="store" size={20} color={COLORS.primary} />
          <Text style={styles.quickNavText}>व्हेंडर व्यवस्थापन</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavBtn}
          onPress={() => onNavigate("bills")}
        >
          <MaterialCommunityIcons name="history" size={22} color={COLORS.primary} />
          <Text style={styles.quickNavText}>जुनी बिले पहा</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickNavBtn}
          onPress={() => onNavigate("settings")}
        >
          <Ionicons name="settings-sharp" size={20} color={COLORS.primary} />
          <Text style={styles.quickNavText}>दुकान सेटिंग्ज</Text>
        </TouchableOpacity>
      </View>

      {/* 5. Recent Bills Section */}
      <View style={styles.recentSectionHeader}>
        <Text style={styles.sectionTitle}>{STRINGS.dashboard.recentBills}</Text>
        <TouchableOpacity onPress={() => onNavigate("bills")}>
          <Text style={styles.viewAllText}>सर्व बिले ({stats ? stats.total_bills_count : 0}) ›</Text>
        </TouchableOpacity>
      </View>

      {stats && stats.recent_bills && stats.recent_bills.length > 0 ? (
        stats.recent_bills.map((bill) => (
          <View key={bill.id} style={styles.recentBillCard}>
            <View style={styles.billCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.billCustomer}>{bill.customer_name}</Text>
                <Text style={styles.billNoDate}>
                  {bill.bill_number} • {bill.bill_date}
                </Text>
              </View>
              <View style={styles.billRightCol}>
                <Text style={styles.billAmount}>₹ {Number(bill.grand_total).toLocaleString("en-IN")}</Text>
                <View
                  style={[
                    styles.statusPill,
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
                      styles.statusPillText,
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
            </View>

            {/* Quick Action Buttons for the bill */}
            <View style={styles.billActionsRow}>
              <TouchableOpacity
                style={styles.billActionBtn}
                onPress={() => onSelectBill(bill.id)}
              >
                <Ionicons name="eye-outline" size={16} color={COLORS.primary} />
                <Text style={styles.billActionText}>तपशील</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.billActionBtn, styles.billPdfBtn]}
                onPress={() => api.openPdf(bill.id, bill.bill_number)}
              >
                <MaterialCommunityIcons name="file-pdf-box" size={18} color="#C62828" />
                <Text style={[styles.billActionText, { color: "#C62828" }]}>PDF बिल</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.billActionBtn, styles.billWaBtn]}
                onPress={() => api.shareToWhatsApp(bill.id)}
              >
                <FontAwesome5 name="whatsapp" size={16} color="#FFFFFF" />
                <Text style={[styles.billActionText, { color: "#FFFFFF", fontWeight: "bold" }]}>
                  WhatsApp
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="basket-outline" size={44} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>{STRINGS.dashboard.noRecentBills}</Text>
          <TouchableOpacity
            style={styles.emptyCreateBtn}
            onPress={() => onNavigate("newBill")}
          >
            <Text style={styles.emptyCreateBtnText}>+ पहिले बिल बनवा</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.md,
  },
  invocationRow: {
    alignItems: "center",
    marginBottom: 4,
  },
  invocationText: {
    color: "#E8F5E9",
    fontSize: 12,
    fontWeight: "600",
  },
  shopName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontWeight: "bold",
    textAlign: "center",
  },
  tagline: {
    color: "#C8E6C9",
    fontSize: 12,
    textAlign: "center",
    marginTop: 2,
    marginBottom: 8,
  },
  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: "center",
    marginTop: 2,
  },
  dateText: {
    color: "#FFFFFF",
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  errorBox: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    flex: 1,
    marginLeft: 8,
  },
  retryBtn: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
  },
  newBillHeroBtn: {
    backgroundColor: COLORS.accentOrange,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    ...SHADOWS.md,
  },
  newBillHeroIconBox: {
    marginRight: 12,
  },
  newBillHeroContent: {
    flex: 1,
  },
  newBillHeroTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },
  newBillHeroSub: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11.5,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    width: "48.5%",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    ...SHADOWS.sm,
  },
  statIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  quickNavRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  quickNavBtn: {
    backgroundColor: COLORS.surface,
    flex: 1,
    marginHorizontal: 3,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  quickNavText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginTop: 6,
  },
  recentSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: 13,
  },
  recentBillCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  billCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  billCustomer: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  billNoDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  billRightCol: {
    alignItems: "flex-end",
  },
  billAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "600",
  },
  billActionsRow: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    justifyContent: "flex-end",
  },
  billActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
    marginLeft: 6,
  },
  billPdfBtn: {
    backgroundColor: "#FFEBEE",
  },
  billWaBtn: {
    backgroundColor: COLORS.whatsapp,
  },
  billActionText: {
    fontSize: 11.5,
    marginLeft: 4,
    color: COLORS.textPrimary,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  emptyCreateBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 12,
  },
  emptyCreateBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
});
