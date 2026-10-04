import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "./src/constants/theme";
import { STRINGS } from "./src/constants/marathiStrings";

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import NewBillScreen from "./src/screens/NewBillScreen";
import BillsListScreen from "./src/screens/BillsListScreen";
import BillDetailScreen from "./src/screens/BillDetailScreen";
import VendorsScreen from "./src/screens/VendorsScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentScreen, setCurrentScreen] = useState("home");
  const [selectedBillId, setSelectedBillId] = useState(null);

  const navigateTo = (screenName) => {
    setCurrentScreen(screenName);
  };

  const handleSelectBill = (billId) => {
    setSelectedBillId(billId);
    setCurrentScreen("billDetail");
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentScreen("home");
  };

  const confirmLogout = () => {
    const doLogout = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      setCurrentScreen("home");
    };

    if (Platform.OS === "web") {
      if (window.confirm("तुम्हाला खात्रीने ॲडमिन खात्यातून लॉगआउट करायचे आहे का?")) {
        doLogout();
      }
    } else {
      Alert.alert(
        "लॉगआउट",
        "तुम्हाला खात्रीने ॲडमिन खात्यातून लॉगआउट करायचे आहे का?",
        [
          { text: "रद्द करा", style: "cancel" },
          { text: "लॉगआउट", style: "destructive", onPress: doLogout },
        ]
      );
    }
  };

  // If not logged in, show Login Screen
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "home":
        return (
          <HomeScreen
            onNavigate={navigateTo}
            onSelectBill={handleSelectBill}
          />
        );
      case "newBill":
        return (
          <NewBillScreen
            onNavigate={navigateTo}
            onBillCreated={(newBill) => {
              setSelectedBillId(newBill.id);
            }}
          />
        );
      case "bills":
        return (
          <BillsListScreen
            onNavigate={navigateTo}
            onSelectBill={handleSelectBill}
          />
        );
      case "billDetail":
        return (
          <BillDetailScreen
            billId={selectedBillId}
            onBack={() => setCurrentScreen("bills")}
            onBillDeleted={() => setCurrentScreen("bills")}
          />
        );
      case "vendors":
        return <VendorsScreen />;
      case "settings":
        return (
          <SettingsScreen
            currentUser={currentUser}
            onLogout={confirmLogout}
          />
        );
      default:
        return (
          <HomeScreen
            onNavigate={navigateTo}
            onSelectBill={handleSelectBill}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />

      {/* Main App Top Bar */}
      <View style={styles.topAppBar}>
        <View style={styles.topAppBarLeft}>
          <MaterialCommunityIcons name="fruit-grapes-outline" size={24} color="#A5D6A7" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.appTitle}>{STRINGS.appName}</Text>
            <Text style={styles.appSubtitle}>{STRINGS.appTagline}</Text>
          </View>
        </View>

        {/* Right side: Admin Pill & Logout */}
        <View style={styles.topAppBarRight}>
          <View style={styles.adminBadge}>
            <FontAwesome5 name="user-shield" size={11} color="#C8E6C9" />
            <Text style={styles.adminBadgeText}>
              {currentUser ? currentUser.username : "admin"}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={confirmLogout}
            title="लॉगआउट"
          >
            <Ionicons name="log-out-outline" size={20} color="#FFCDD2" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Body */}
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {/* 1. Home Tab */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => navigateTo("home")}
        >
          <Ionicons
            name={currentScreen === "home" ? "home" : "home-outline"}
            size={22}
            color={currentScreen === "home" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navTabText,
              currentScreen === "home" && styles.navTabTextActive,
            ]}
          >
            {STRINGS.tabs.home}
          </Text>
        </TouchableOpacity>

        {/* 2. Bills Tab */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => navigateTo("bills")}
        >
          <MaterialCommunityIcons
            name={
              currentScreen === "bills" || currentScreen === "billDetail"
                ? "clipboard-text"
                : "clipboard-text-outline"
            }
            size={22}
            color={
              currentScreen === "bills" || currentScreen === "billDetail"
                ? COLORS.primary
                : COLORS.textMuted
            }
          />
          <Text
            style={[
              styles.navTabText,
              (currentScreen === "bills" || currentScreen === "billDetail") &&
                styles.navTabTextActive,
            ]}
          >
            {STRINGS.tabs.bills}
          </Text>
        </TouchableOpacity>

        {/* 3. Center Elevated New Bill Tab */}
        <TouchableOpacity
          style={styles.centerFabWrap}
          activeOpacity={0.88}
          onPress={() => navigateTo("newBill")}
        >
          <View style={styles.centerFab}>
            <Ionicons name="add" size={30} color="#FFFFFF" />
          </View>
          <Text
            style={[
              styles.navTabText,
              currentScreen === "newBill" && styles.navTabTextActive,
              { marginTop: 2 },
            ]}
          >
            {STRINGS.tabs.newBill}
          </Text>
        </TouchableOpacity>

        {/* 4. Vendors Tab */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => navigateTo("vendors")}
        >
          <FontAwesome5
            name="store"
            size={18}
            color={currentScreen === "vendors" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navTabText,
              currentScreen === "vendors" && styles.navTabTextActive,
            ]}
          >
            {STRINGS.tabs.vendors}
          </Text>
        </TouchableOpacity>

        {/* 5. Settings Tab */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => navigateTo("settings")}
        >
          <Ionicons
            name={currentScreen === "settings" ? "settings" : "settings-outline"}
            size={22}
            color={currentScreen === "settings" ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navTabText,
              currentScreen === "settings" && styles.navTabTextActive,
            ]}
          >
            {STRINGS.tabs.settings}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  topAppBar: {
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  topAppBarLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  topAppBarRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  appTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  appSubtitle: {
    color: "#C8E6C9",
    fontSize: 10.5,
  },
  adminBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(198, 40, 40, 0.25)",
  },
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "space-around",
    ...SHADOWS.md,
  },
  navTab: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 4,
  },
  navTabText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 3,
    fontWeight: "500",
  },
  navTabTextActive: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
  centerFabWrap: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    top: -12,
  },
  centerFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accentOrange,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.md,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
});
