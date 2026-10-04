import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../constants/theme";
import { STRINGS } from "../constants/marathiStrings";
import { api, getApiBaseUrl, setApiBaseUrl } from "../services/api";

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [ipSaveSuccess, setIpSaveSuccess] = useState(false);

  const handleLogin = async () => {
    if (!username.trim()) {
      setErrorMessage("कृपया वापरकर्ता नाव किंवा फोन नंबर प्रविष्ट करा.");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("कृपया पासवर्ड प्रविष्ट करा.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const res = await api.login(username.trim(), password.trim());
      if (res && res.success) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res.message || "लॉगिन अयशस्वी. कृपया पुन्हा प्रयत्न करा.");
      }
    } catch (err) {
      setErrorMessage(err.message || "लॉगिन अयशस्वी. पासवर्ड तपासा.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsername("admin");
    setPassword("admin123");
    setErrorMessage("");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Invocation & Logo */}
        <View style={styles.header}>
          <Text style={styles.invocationText}>{STRINGS.invocation}</Text>
          <View style={styles.logoCircle}>
            <MaterialCommunityIcons name="fruit-grapes" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.appTitle}>{STRINGS.appName}</Text>
          <Text style={styles.appTagline}>{STRINGS.appTagline}</Text>
        </View>

        {/* Login Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <FontAwesome5 name="user-shield" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>ॲडमिन सुरक्षित लॉगिन</Text>
          </View>
          <Text style={styles.cardSubtitle}>
            बिलिंग ऍप्लिकेशनमध्ये प्रवेश करण्यासाठी कृपया आपले ॲडमिन क्रेडेंशियल्स टाका.
          </Text>

          {/* Error Message Box */}
          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color={COLORS.danger} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Username Input */}
          <Text style={styles.inputLabel}>वापरकर्ता नाव (Username) *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="उदा. admin किंवा मोबाइल नंबर"
              placeholderTextColor={COLORS.textMuted}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                if (errorMessage) setErrorMessage("");
              }}
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <Text style={styles.inputLabel}>पासवर्ड (Password) *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="पासवर्ड प्रविष्ट करा"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errorMessage) setErrorMessage("");
              }}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Auto-fill Demo Credentials Card */}
          <TouchableOpacity
            style={styles.demoCard}
            onPress={fillDemoCredentials}
            activeOpacity={0.8}
          >
            <View style={styles.demoHeader}>
              <Ionicons name="key-outline" size={16} color={COLORS.accentOrange} />
              <Text style={styles.demoTitle}>डिफॉल्ट ॲडमिन लॉगिन (येथे टॅप करा):</Text>
            </View>
            <Text style={styles.demoText}>
              वापरकर्ता: <Text style={styles.demoBold}>admin</Text>  |  पासवर्ड: <Text style={styles.demoBold}>admin123</Text>
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in-outline" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.loginBtnText}>लॉगिन करा (Login)</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Server Connection Config (IP Settings) */}
          <TouchableOpacity
            style={styles.serverConfigToggle}
            onPress={() => {
              setShowServerConfig(!showServerConfig);
              setIpSaveSuccess(false);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="hardware-chip-outline" size={15} color={COLORS.primary} />
            <Text style={styles.serverConfigToggleText}>
              {showServerConfig ? "सर्व्हर सेटिंग्ज लपवा ▲" : "सर्व्हर IP बदला (Server Settings) ▼"}
            </Text>
          </TouchableOpacity>

          {showServerConfig && (
            <View style={styles.serverConfigBox}>
              <Text style={styles.serverConfigLabel}>संगणकाचा Wi-Fi सर्व्हर IP पत्ता:</Text>
              <View style={[styles.inputWrapper, { marginBottom: 8 }]}>
                <Ionicons name="wifi-outline" size={18} color={COLORS.primary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={serverUrl}
                  onChangeText={(txt) => {
                    setServerUrl(txt);
                    setIpSaveSuccess(false);
                  }}
                  placeholder="उदा. https://vegitables-billing-api.onrender.com"
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                />
              </View>
              <TouchableOpacity
                style={styles.saveIpBtn}
                onPress={() => {
                  setApiBaseUrl(serverUrl);
                  setErrorMessage("");
                  setIpSaveSuccess(true);
                  setTimeout(() => setIpSaveSuccess(false), 3000);
                }}
              >
                <Text style={styles.saveIpBtnText}>IP जतन करा (Save IP)</Text>
              </TouchableOpacity>
              {ipSaveSuccess && (
                <Text style={styles.ipSuccessText}>✓ सर्व्हर IP पत्ता अपडेट झाला!</Text>
              )}
            </View>
          )}
        </View>

        {/* Footer info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 सुरक्षित व स्थानिक डेटाबेस संरक्षण • भाजीपाला व्यापार प्रणाली
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 35,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  invocationText: {
    fontSize: 13,
    color: COLORS.primaryLight,
    fontWeight: "bold",
    marginBottom: 8,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...SHADOWS.md,
  },
  appTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: COLORS.primaryDark,
    textAlign: "center",
  },
  appTagline: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 3,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.primary,
    marginLeft: 8,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 12.5,
    marginLeft: 8,
    flex: 1,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: "bold",
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FBF9",
    borderWidth: 1.2,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textPrimary,
    height: "100%",
  },
  eyeBtn: {
    padding: 6,
  },
  demoCard: {
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  demoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.accentOrange,
    marginLeft: 6,
  },
  demoText: {
    fontSize: 12.5,
    color: "#5D4037",
    marginTop: 2,
  },
  demoBold: {
    fontWeight: "bold",
    color: COLORS.primaryDark,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
  },
  loginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  serverConfigToggle: {
    marginTop: 16,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  serverConfigToggleText: {
    color: COLORS.primary,
    fontSize: 12.5,
    fontWeight: "600",
    marginLeft: 6,
  },
  serverConfigBox: {
    marginTop: 10,
    padding: 12,
    backgroundColor: "#F1F8E9",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  serverConfigLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  saveIpBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveIpBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "bold",
  },
  ipSuccessText: {
    marginTop: 6,
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  footer: {
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
