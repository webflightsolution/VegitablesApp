import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";
import { STRINGS } from "../constants/marathiStrings";
import { api } from "../services/api";

export default function VendorsScreen() {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Add/Edit Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form Fields
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getVendors();
      setVendors(data);
      setFilteredVendors(data);
    } catch (err) {
      console.warn("Failed to load vendors:", err);
      Alert.alert("त्रुटी", "व्हेंडर्सची यादी आणता आली नाही.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Search Filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVendors(vendors);
    } else {
      const q = searchQuery.toLowerCase();
      const filtered = vendors.filter(
        (v) =>
          (v.name && v.name.toLowerCase().includes(q)) ||
          (v.mobile && v.mobile.toLowerCase().includes(q)) ||
          (v.address && v.address.toLowerCase().includes(q))
      );
      setFilteredVendors(filtered);
    }
  }, [searchQuery, vendors]);

  const openAddModal = () => {
    setEditingVendor(null);
    setName("");
    setMobile("");
    setAddress("");
    setNotes("");
    setModalVisible(true);
  };

  const openEditModal = (vendor) => {
    setEditingVendor(vendor);
    setName(vendor.name || "");
    setMobile(vendor.mobile || "");
    setAddress(vendor.address || "");
    setNotes(vendor.notes || "");
    setModalVisible(true);
  };

  const handleSaveVendor = async () => {
    if (!name.trim()) {
      Alert.alert("अपूर्ण माहिती", "कृपया व्हेंडरचे नाव प्रविष्ट करा.");
      return;
    }

    const payload = {
      name: name.trim(),
      mobile: mobile.trim(),
      address: address.trim(),
      notes: notes.trim(),
    };

    try {
      setSaving(true);
      if (editingVendor) {
        await api.updateVendor(editingVendor.id, payload);
      } else {
        await api.createVendor(payload);
      }
      setModalVisible(false);
      loadVendors();
    } catch (err) {
      Alert.alert("त्रुटी", err.message || "व्हेंडर जतन करता आला नाही.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVendor = (vendor) => {
    const doDelete = async () => {
      try {
        await api.deleteVendor(vendor.id);
        loadVendors();
      } catch (err) {
        Alert.alert("त्रुटी", err.message || "व्हेंडर हटवता आला नाही.");
      }
    };

    if (Platform.OS === "web") {
      if (window.confirm(`तुम्हाला '${vendor.name}' हा व्हेंडर खरंच हटवायचा आहे का?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        STRINGS.vendors.deleteVendor,
        `तुम्हाला '${vendor.name}' हा व्हेंडर खरंच हटवायचा आहे का?`,
        [
          { text: "रद्द करा", style: "cancel" },
          { text: "हटवा", style: "destructive", onPress: doDelete },
        ]
      );
    }
  };

  const handleCallVendor = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    Linking.openURL(`tel:${cleanPhone}`);
  };

  return (
    <View style={styles.container}>
      {/* Header & Search */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <FontAwesome5 name="store" size={20} color={COLORS.primary} />
          <Text style={styles.titleText}>{STRINGS.vendors.title}</Text>
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{STRINGS.vendors.addVendor}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={STRINGS.vendors.searchPlaceholder}
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Vendor List */}
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredVendors}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            loadVendors();
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <MaterialCommunityIcons name="account-search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{STRINGS.vendors.noVendorsFound}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.vendorCard}>
              <View style={styles.vendorCardHeader}>
                <View style={styles.vendorIconBox}>
                  <FontAwesome5 name="store-alt" size={18} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.vendorName}>{item.name}</Text>
                  {item.address ? (
                    <View style={styles.vendorInfoRow}>
                      <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
                      <Text style={styles.vendorAddress} numberOfLines={1}>
                        {item.address}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Mobile & Notes */}
              {item.mobile ? (
                <TouchableOpacity
                  style={styles.phoneChip}
                  onPress={() => handleCallVendor(item.mobile)}
                >
                  <Ionicons name="call" size={13} color={COLORS.primary} />
                  <Text style={styles.phoneChipText}>कॉल करा: {item.mobile}</Text>
                </TouchableOpacity>
              ) : null}

              {item.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>भाजी पुरवठा / शेरा: {item.notes}</Text>
                </View>
              ) : null}

              {/* Action Buttons */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.editBtn]}
                  onPress={() => openEditModal(item)}
                >
                  <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.editBtnText}>संपादित करा</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => handleDeleteVendor(item)}
                >
                  <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                  <Text style={styles.deleteBtnText}>हटवा</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* --- ADD / EDIT VENDOR MODAL --- */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVendor ? STRINGS.vendors.editVendor : STRINGS.vendors.addVendor}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{STRINGS.vendors.vendorName} *</Text>
            <TextInput
              style={styles.input}
              placeholder={STRINGS.vendors.vendorNamePlaceholder}
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.inputLabel}>{STRINGS.vendors.mobile}</Text>
            <TextInput
              style={styles.input}
              placeholder={STRINGS.vendors.mobilePlaceholder}
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
            />

            <Text style={styles.inputLabel}>{STRINGS.vendors.address}</Text>
            <TextInput
              style={styles.input}
              placeholder={STRINGS.vendors.addressPlaceholder}
              placeholderTextColor={COLORS.textMuted}
              value={address}
              onChangeText={setAddress}
            />

            <Text style={styles.inputLabel}>{STRINGS.vendors.notes}</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: "top" }]}
              placeholder={STRINGS.vendors.notesPlaceholder}
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={2}
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>{STRINGS.vendors.cancel}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveModalBtn, saving && { opacity: 0.7 }]}
                onPress={handleSaveVendor}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveModalBtnText}>{STRINGS.vendors.save}</Text>
                )}
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
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
    ...SHADOWS.sm,
  },
  addBtnText: {
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
  vendorCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  vendorCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  vendorIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  vendorName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.textPrimary,
  },
  vendorInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  vendorAddress: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  phoneChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginTop: 8,
  },
  phoneChipText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 6,
    fontWeight: "600",
  },
  notesBox: {
    backgroundColor: "#F9FBF9",
    borderRadius: 6,
    padding: 6,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryLight,
  },
  notesText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 8,
  },
  editBtn: {
    backgroundColor: COLORS.surfaceVariant,
  },
  editBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "#FFEBEE",
  },
  deleteBtnText: {
    fontSize: 12,
    color: COLORS.danger,
    marginLeft: 4,
    fontWeight: "600",
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
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
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
    fontSize: 13.5,
    color: COLORS.textPrimary,
  },
  modalButtonsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  cancelBtnText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  saveModalBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  saveModalBtnText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
});
