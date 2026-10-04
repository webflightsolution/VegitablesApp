import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";
import { STRINGS } from "../constants/marathiStrings";
import { api, getApiBaseUrl, setApiBaseUrl } from "../services/api";

export default function SettingsScreen({ currentUser, onLogout }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingServer, setTestingServer] = useState(false);

  // Shop Settings
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [tagline, setTagline] = useState("");
  const [upiId, setUpiId] = useState("");
  const [terms, setTerms] = useState("");

  // Backend URL
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.getSettings();
      setShopName(data.shop_name || "");
      setOwnerName(data.owner_name || "");
      setMobile(data.mobile || "");
      setAddress(data.address || "");
      setTagline(data.tagline || "");
      setUpiId(data.upi_id || "");
      setTerms(data.terms || "");
    } catch (err) {
      console.warn("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!shopName.trim()) {
      Alert.alert("अपूर्ण माहिती", "कृपया दुकानाचे नाव प्रविष्ट करा.");
      return;
    }

    try {
      setSaving(true);
      // Update backend URL if changed
      setApiBaseUrl(serverUrl);

      const payload = {
        shop_name: shopName.trim(),
        owner_name: ownerName.trim(),
        mobile: mobile.trim(),
        address: address.trim(),
        tagline: tagline.trim(),
        upi_id: upiId.trim(),
        terms: terms.trim(),
      };

      await api.updateSettings(payload);
      Alert.alert("यशस्वी", STRINGS.settings.settingsSaved);
    } catch (err) {
      Alert.alert("त्रुटी", err.message || "सेटिंग्ज जतन करता आल्या नाहीत.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestingServer(true);
      setApiBaseUrl(serverUrl);
      const res = await api.getDashboard();
      if (res) {
        Alert.alert("जोडणी यशस्वी!", `सर्व्हरशी यशस्वी संपर्क झाला.\nएकूण बिले: ${res.total_bills_count}`);
      }
    } catch (err) {
      Alert.alert("जोडणी अयशस्वी", `सर्व्हरशी संपर्क होऊ शकला नाही.\n${err.message}`);
    } finally {
      setTestingServer(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="settings" size={22} color={COLORS.primary} />
        <Text style={styles.headerTitle}>{STRINGS.settings.title}</Text>
      </View>

      {/* Shop Profile Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>दुकान व पावती तपशील (PDF साठी)</Text>

        <Text style={styles.inputLabel}>{STRINGS.settings.shopName} *</Text>
        <TextInput
          style={styles.input}
          value={shopName}
          onChangeText={setShopName}
          placeholder="उदा. श्री सिद्धिविनायक व्हेजिटेबल ट्रेडर्स"
        />

        <Text style={styles.inputLabel}>{STRINGS.settings.ownerName}</Text>
        <TextInput
          style={styles.input}
          value={ownerName}
          onChangeText={setOwnerName}
          placeholder="उदा. गणेश पाटील"
        />

        <Text style={styles.inputLabel}>{STRINGS.settings.mobile}</Text>
        <TextInput
          style={styles.input}
          value={mobile}
          onChangeText={setMobile}
          keyboardType="phone-pad"
          placeholder="उदा. ९८७६५४३२१०"
        />

        <Text style={styles.inputLabel}>{STRINGS.settings.address}</Text>
        <TextInput
          style={styles.input}
          value={address}
          onChangeText={setAddress}
          placeholder="गाळा नं. २४, भाजी मार्केट यार्ड, पुणे"
        />

        <Text style={styles.inputLabel}>{STRINGS.settings.tagline}</Text>
        <TextInput
          style={styles.input}
          value={tagline}
          onChangeText={setTagline}
          placeholder="उदा. सर्व ताज्या भाजीपाल्याचे घाऊक व्यापारी"
        />

        <Text style={styles.inputLabel}>{STRINGS.settings.upiId}</Text>
        <TextInput
          style={styles.input}
          value={upiId}
          onChangeText={setUpiId}
          placeholder="उदा. 9876543210@upi"
        />

        <Text style={styles.inputLabel}>{STRINGS.settings.terms}</Text>
        <TextInput
          style={[styles.input, { height: 65, textAlignVertical: "top" }]}
          value={terms}
          onChangeText={setTerms}
          multiline
          numberOfLines={2}
          placeholder="माल तपासून खात्री करून घेणे..."
        />
      </View>

      {/* Server Configuration Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{STRINGS.settings.serverUrl}</Text>
        <Text style={styles.helpText}>{STRINGS.settings.serverUrlHint}</Text>

        <TextInput
          style={[styles.input, { marginTop: 6 }]}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="http://192.168.1.10:8000"
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.testBtn}
          onPress={handleTestConnection}
          disabled={testingServer}
        >
          {testingServer ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <MaterialCommunityIcons name="server-network" size={16} color={COLORS.primary} />
              <Text style={styles.testBtnText}>सर्व्हर जोडणी तपासा</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Admin Account & Logout Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>ॲडमिन खाते व सुरक्षितता (Account)</Text>
        <View style={styles.adminRow}>
          <FontAwesome5 name="user-shield" size={18} color={COLORS.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: "bold", color: COLORS.textPrimary }}>
              सध्याचे ॲडमिन खाते: {currentUser ? currentUser.username : "admin"}
            </Text>
            <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
              भूमिका: {currentUser ? currentUser.role : "मुख्य ॲडमिन"}
            </Text>
          </View>
        </View>

        {onLogout && (
          <TouchableOpacity
            style={styles.logoutCardBtn}
            onPress={onLogout}
          >
            <Ionicons name="log-out-outline" size={18} color={COLORS.danger} style={{ marginRight: 6 }} />
            <Text style={styles.logoutCardBtnText}>खात्यातून लॉगआउट करा</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.7 }]}
        onPress={handleSaveSettings}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.saveBtnText}>{STRINGS.settings.saveSettings}</Text>
          </>
        )}
      </TouchableOpacity>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
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
  cardTitle: {
    fontSize: 14.5,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceVariant,
    paddingBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textPrimary,
    marginBottom: 4,
    marginTop: 8,
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
  helpText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surfaceVariant,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testBtnText: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: COLORS.primary,
    marginLeft: 6,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 20,
    ...SHADOWS.md,
  },
  saveBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
  },
  adminRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FBF9",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  logoutCardBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEBEE",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  logoutCardBtnText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: "bold",
  },
});
