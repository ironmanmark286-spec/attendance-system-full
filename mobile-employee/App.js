import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { View, Text, TextInput, Alert, StyleSheet, Animated, ScrollView, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, Dimensions, TouchableOpacity, StatusBar, Linking, RefreshControl } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";

// --- SMART API URL CONFIGURATION ---
// Auto-selects based on platform emulator. If testing on a physical phone via Expo Go,
// replace this with your laptop's Wi-Fi IP address (e.g., "http://192.168.1.100:5000").
const API_URL = Platform.OS === 'android' ? "http://10.0.2.2:5000" : "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000 // 10 seconds timeout to prevent hanging
});

const { width, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IS_SMALL_SCREEN = SCREEN_HEIGHT < 700;

const format12Hour = (date, withSeconds = false) => {
  if (!date || isNaN(date.getTime())) return "--:--";
  let h = date.getHours();
  let m = date.getMinutes().toString().padStart(2, '0');
  let s = date.getSeconds().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m}${withSeconds ? ':' + s : ''} ${ampm}`;
};

const formatMins = (mins) => {
  if (!mins) return "0h 0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
};

const LiveClock = React.memo(({ palette }) => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  return (
    <View style={styles.clockContainer}>
      <Text style={[styles.dateText, { color: palette.primary }]}>
        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
      </Text>
      <Text style={[styles.clockText, { color: palette.textPrimary }]}>
        {format12Hour(time, true)}
      </Text>
    </View>
  );
});

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [token, setToken] = useState("");
  const [companyCode, setCompanyCode] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [profile, setProfile] = useState({ name: "", emp_code: "", department: "", designation: "" });
  
  const [theme, setTheme] = useState("light"); // Better default visibility
  const [activeTab, setActiveTab] = useState("Home");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  const [checkInTime, setCheckInTime] = useState("--:--");
  const [checkOutTime, setCheckOutTime] = useState("--:--");
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [todayTotalMinutes, setTodayTotalMinutes] = useState(0);
  const [todayOT, setTodayOT] = useState(0);
  const [history, setHistory] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [onlineTeam, setOnlineTeam] = useState([]);
  
  const [myTickets, setMyTickets] = useState([
    { id: 'TKT-102', title: 'Laptop Battery Setup Issue', status: 'IN_PROGRESS', date: 'Oct 24, 2024', priority: 'High' },
    { id: 'TKT-089', title: 'Salary Slip Request', status: 'RESOLVED', date: 'Oct 10, 2024', priority: 'Low' }
  ]);
  
  const [otSettings, setOtSettings] = useState({
    standard_hours: 9.0,
    ot_rate_multiplier: 1.5,
    ot_applicable_from_minutes: 540,
    max_daily_ot_minutes: 180,
    weekly_off_days: "Saturday,Sunday",
    ot_payment_condition: "Above standard hours"
  });
  
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ start_date: '', end_date: '', leave_type: 'Annual Leave', reason: '' });
  const [isApplyingLeave, setIsApplyingLeave] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const fade = useRef(new Animated.Value(1)).current;

  const handleLogout = useCallback(async () => {
    await AsyncStorage.removeItem("token");
    setToken("");
    setProfile({ name: "", emp_code: "", department: "", designation: "" });
  }, []);

  const loadData = useCallback(async (currentToken) => {
    if (!currentToken) return;
    try {
      const headers = { Authorization: `Bearer ${currentToken}` };
      const [profRes, histRes, leaveRes, payslipRes, teamRes, otRes] = await Promise.all([
        api.get("/employees/me", { headers }),
        api.get("/attendance/history", { headers }),
        api.get("/leaves/me", { headers }).catch(() => ({ data: [] })),
        api.get("/payslips/me", { headers }).catch(() => ({ data: [] })),
        api.get("/attendance/online-team", { headers }).catch(() => ({ data: [] })),
        api.get("/ot-settings", { headers }).catch(() => ({ data: {} }))
      ]);

      setProfile(profRes.data || {});
      await AsyncStorage.setItem("empName", profRes.data?.name || "");
      if (Array.isArray(histRes.data)) {
        setHistory(histRes.data);
        if (histRes.data.length > 0 && histRes.data[0].check_in) {
          const latest = histRes.data[0];
          const checkInDate = new Date(latest.check_in);
          
          const today = new Date();
          const attDate = new Date(latest.att_date);
          const isToday = today.getFullYear() === attDate.getFullYear() && today.getMonth() === attDate.getMonth() && today.getDate() === attDate.getDate();
          
          if (isToday) {
            setCheckInTime(format12Hour(checkInDate));
            setCheckOutTime(latest.check_out ? format12Hour(new Date(latest.check_out)) : "--:--");
            setIsPunchedIn(latest.is_punched_in === true);
            setTodayTotalMinutes(latest.total_minutes || 0);
            setTodayOT(latest.overtime_minutes || 0);
          } else {
            setCheckInTime("--:--"); setCheckOutTime("--:--");
            setIsPunchedIn(false);
            setTodayTotalMinutes(0);
            setTodayOT(0);
          }
        } else {
            setCheckInTime("--:--"); setCheckOutTime("--:--");
            setIsPunchedIn(false);
            setTodayTotalMinutes(0);
            setTodayOT(0);
        }
      }

      setMyLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : []);
      setPayslips(Array.isArray(payslipRes.data) ? payslipRes.data : []);
      setOnlineTeam(Array.isArray(teamRes.data) ? teamRes.data : []);
      if (otRes.data && Object.keys(otRes.data).length > 0) {
        setOtSettings(otRes.data);
      }
    } catch (e) { 
      console.log("Error loading data:", e); 
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        Alert.alert("Session Expired", "Your session has expired. Please log in again.");
        handleLogout();
      }
    }
  }, [handleLogout]);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadData(token);
    setRefreshing(false);
  }, [token, loadData]);

  useEffect(() => {
    (async () => {
      try {
        const t = await AsyncStorage.getItem("token");
        const th = await AsyncStorage.getItem("theme");
        const savedCompany = await AsyncStorage.getItem("companyCode");
        const savedUsername = await AsyncStorage.getItem("username");
        if (savedCompany) setCompanyCode(savedCompany);
        if (savedUsername) setUsername(savedUsername);
        if (th) setTheme(th);
        if (t) { setToken(t); loadData(t); }
      } catch (err) {}
    })();
  }, [loadData]);

  const login = async () => {
    if (!companyCode || !username || !password) return Alert.alert("Error", "Please fill all fields.");
    setIsLoggingIn(true);
    try {
      if (isResetting) {
        const { data } = await api.post("/auth/reset-password", { companyCode, username, newPassword: password });
        Alert.alert("Success", data.message || "Password reset successfully. Please login.");
        setIsResetting(false);
        setPassword("");
      } else {
        const { data } = await api.post("/auth/login", { companyCode, username, password });
        if (data.role !== "EMPLOYEE") return Alert.alert("Access Denied", "Please login with an employee account.");
        
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("companyCode", companyCode);
        await AsyncStorage.setItem("username", username);
        setToken(data.token);
        loadData(data.token);
      }
    } catch (e) {
      Alert.alert(isResetting ? "Reset Failed" : "Login Failed", e?.response?.data?.message || "Check connection");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const toggleTheme = async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    await AsyncStorage.setItem("theme", nextTheme);
  };

  const handleLocationAction = async (type) => {
    setIsLocating(true);
    let addressStr = "Unknown Location";
    try {
      // Request permissions without blocking the main flow drastically
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Fast Location Fetch for Zero Lag
        let loc = await Location.getLastKnownPositionAsync();
        if (!loc) {
          loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        }
        if (loc) {
          try {
            // Get Real Street/City Address
            const [geocode] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            if (geocode) {
              addressStr = `${geocode.name || geocode.street || ''}, ${geocode.city || geocode.region || ''}`.replace(/^, /, '').trim();
            } else {
              addressStr = `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
            }
          } catch (e) {
            addressStr = `${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`;
          }
        }
      }
    } catch (e) {
      console.log("GPS fetch skipped/failed:", e);
    }
    
    // Immediately proceed to check-in/out
    await confirmAttendance(type, addressStr);
  };

  const confirmAttendance = async (type, address) => {
    const endpoint = type === 'In' ? "/attendance/check-in" : "/attendance/check-out";
    
    try {
      const { data } = await api.post(endpoint, { location: address }, { headers: { Authorization: `Bearer ${token}` } });
      const nowStr = format12Hour(new Date());
      if (type === 'In') {
        setCheckInTime(nowStr);
        setIsPunchedIn(true);
      } else {
        setCheckOutTime(nowStr);
        setIsPunchedIn(false);
      }
      await loadData(token); // Ensure full reload state updates button instantly
      Alert.alert("Success", type === 'In' ? `Checked in instantly at ${data.companyName || 'Workspace'}.` : `Checked out successfully. Total: ${data.totalMinutes || 0} mins`);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Operation failed");
    } finally {
      setIsLocating(false);
    }
  };

  const submitLeave = async () => {
    if (!leaveForm.start_date || !leaveForm.end_date) return Alert.alert("Error", "Provide start and end dates");
    setIsApplyingLeave(true);
    try {
      await api.post("/leaves/apply", leaveForm, { headers: { Authorization: `Bearer ${token}` } });
      Alert.alert("Success", "Leave request submitted for approval");
      setLeaveModalVisible(false);
      setLeaveForm({ start_date: '', end_date: '', leave_type: 'Annual Leave', reason: '' });
      loadData(token);
    } catch (e) {
      Alert.alert("Error", e?.response?.data?.message || "Failed to submit leave");
    } finally {
      setIsApplyingLeave(false);
    }
  };

  const isDark = theme === "dark";
  const palette = useMemo(() => ({
    bgApp: isDark ? "#09090b" : "#f4f7fb",
    bgCard: isDark ? "#18181b" : "#ffffff",
    bgInput: isDark ? "#27272a" : "#f1f5f9",
    border: isDark ? "#27272a" : "#e2e8f0",
    textPrimary: isDark ? "#fafafa" : "#0f172a",
    textSecondary: isDark ? "#a1a1aa" : "#64748b",
    primary: "#6366f1",
    primaryHover: "#818cf8",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    tabBg: isDark ? "rgba(9, 9, 11, 0.98)" : "rgba(255, 255, 255, 0.98)",
    shadow: isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.08)",
  }), [isDark]);

  const tabBarBottom = Math.max(insets.bottom, 12) + 8;
  const contentPadBottom = 76 + tabBarBottom;

  if (!token) {
    const loginPadH = IS_SMALL_SCREEN ? 16 : 24;
    const loginCardPad = IS_SMALL_SCREEN ? 22 : 28;
    return (
      <View style={{ flex: 1, backgroundColor: isDark ? "#09090b" : "#eef2ff" }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#09090b" : "#eef2ff"} translucent={false} />
        <LinearGradient
          colors={isDark ? ["#09090b", "#1e1b4b", "#312e81"] : ["#eef2ff", "#e0e7ff", "#c7d2fe"]}
          style={StyleSheet.absoluteFill}
        />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingHorizontal: loginPadH,
              paddingVertical: loginPadH,
              minHeight: SCREEN_HEIGHT - insets.top - insets.bottom,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View style={[styles.loginCard, IS_SMALL_SCREEN && styles.loginCardCompact, { opacity: fade, padding: loginCardPad, backgroundColor: isDark ? "rgba(24, 24, 27, 0.92)" : "rgba(255, 255, 255, 0.95)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(99, 102, 241, 0.15)", shadowColor: "#000" }]}>
              <LinearGradient colors={["#6366f1", "#8b5cf6"]} style={[styles.loginLogoContainer, IS_SMALL_SCREEN && { width: 64, height: 64, marginBottom: 16 }]}>
                <FontAwesome5 name="fingerprint" size={IS_SMALL_SCREEN ? 28 : 36} color="#fff" />
              </LinearGradient>

              <Text style={[styles.loginTitle, IS_SMALL_SCREEN && { fontSize: 28 }, { color: palette.textPrimary }]}>Pulse<Text style={{ color: palette.primary }}>HR</Text></Text>
              <Text style={[styles.loginSubTitle, IS_SMALL_SCREEN && { fontSize: 14, marginBottom: 20 }, { color: palette.textSecondary }]}>{isResetting ? "Reset your password securely" : "Enterprise attendance access"}</Text>

              <View style={[styles.inputGroup, IS_SMALL_SCREEN && { marginBottom: 14 }]}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Company Code</Text>
                <TextInput style={[styles.loginInput, IS_SMALL_SCREEN && styles.loginInputCompact, { color: palette.textPrimary, backgroundColor: palette.bgInput, borderColor: palette.border }]} value={companyCode} onChangeText={setCompanyCode} placeholder="PULSE-01" placeholderTextColor={palette.textSecondary} autoCapitalize="characters" />
              </View>

              <View style={[styles.inputGroup, IS_SMALL_SCREEN && { marginBottom: 14 }]}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Employee Code</Text>
                <TextInput style={[styles.loginInput, IS_SMALL_SCREEN && styles.loginInputCompact, { color: palette.textPrimary, backgroundColor: palette.bgInput, borderColor: palette.border }]} value={username} onChangeText={setUsername} placeholder="EMP-100" placeholderTextColor={palette.textSecondary} autoCapitalize="none" autoComplete="username" />
              </View>

              <View style={[styles.inputGroup, IS_SMALL_SCREEN && { marginBottom: 14 }]}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>{isResetting ? "New Password" : "Password"}</Text>
                <TextInput style={[styles.loginInput, IS_SMALL_SCREEN && styles.loginInputCompact, { color: palette.textPrimary, backgroundColor: palette.bgInput, borderColor: palette.border }]} value={password} onChangeText={setPassword} placeholder="••••••••" placeholderTextColor={palette.textSecondary} secureTextEntry autoComplete="password" />
                <TouchableOpacity onPress={() => { setIsResetting(!isResetting); setPassword(""); }} style={{ alignSelf: "flex-end", marginTop: 10 }}>
                  <Text style={{ color: palette.primary, fontSize: 13, fontWeight: "700" }}>{isResetting ? "Back to Login" : "Forgot Password?"}</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity activeOpacity={0.85} onPress={login} disabled={isLoggingIn}>
                <LinearGradient colors={["#4f46e5", "#7c3aed"]} style={[styles.primaryBtn, IS_SMALL_SCREEN && { paddingVertical: 16 }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                  {isLoggingIn ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>{isResetting ? "Reset Password" : "Sign In"}</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    );
  }

  const Header = ({ title }) => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>{title}</Text>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow }]} onPress={() => loadData(token)}>
          <Ionicons name="refresh" size={20} color={palette.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow }]} onPress={toggleTheme}>
          <Ionicons name={isDark ? "sunny" : "moon"} size={20} color={palette.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: palette.bgApp, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={palette.bgApp} translucent={false} />
      <Animated.View style={{ opacity: fade, flex: 1, paddingBottom: contentPadBottom }}>
          
          {/* TAB: HOME */}
          {activeTab === 'Home' && (
            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} tintColor={palette.primary} />}>
              <Header title={`Hello, ${(profile.name || "there").split(" ")[0]}`} />
              
              <LiveClock palette={palette} />
              
              {/* AI Motivation Widget */}
              <View style={[styles.quoteCard, { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.3)' }]}>
                 <Ionicons name="sparkles" size={20} color={palette.primary} style={{ marginBottom: 8 }} />
                 <Text style={{ color: palette.textPrimary, fontSize: 15, fontWeight: '700', fontStyle: 'italic', lineHeight: 22 }}>
                   "The only way to do great work is to love what you do."
                 </Text>
                 <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 8, fontWeight: '800' }}>
                   - Steve Jobs
                 </Text>
              </View>

              {/* Professional Stats Row */}
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
                <View style={[styles.proStatCard, { backgroundColor: palette.bgCard, borderColor: palette.border }]}>
                   <View style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: 10, borderRadius: 12, alignSelf: 'flex-start' }}>
                      <Ionicons name="briefcase" size={20} color={palette.primary} />
                   </View>
                   <Text style={{ color: palette.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 12 }}>TODAY'S SHIFT</Text>
                   <Text style={{ color: palette.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 4 }}>09:00 AM</Text>
                </View>
                <View style={[styles.proStatCard, { backgroundColor: palette.bgCard, borderColor: palette.border }]}>
                   <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 12, alignSelf: 'flex-start' }}>
                      <Ionicons name="time" size={20} color={palette.success} />
                   </View>
                   <Text style={{ color: palette.textSecondary, fontSize: 12, fontWeight: '700', marginTop: 12 }}>OPEN TICKETS</Text>
                   <Text style={{ color: palette.textPrimary, fontSize: 15, fontWeight: '800', marginTop: 4 }}>1 Active</Text>
                </View>
              </View>

              {/* The "SaaS Check-in" - Modern Glowing Capsule */}
              <View style={{ alignItems: 'center', marginVertical: 10, marginBottom: 16 }}>
                <TouchableOpacity 
                  activeOpacity={0.8} 
                  onPress={() => handleLocationAction(!isPunchedIn ? 'In' : 'Out')} 
                  disabled={isLocating}
                >
                  <LinearGradient 
                    colors={!isPunchedIn ? ['#10b981', '#059669'] : ['#ef4444', '#dc2626']} 
                    style={{ borderRadius: 100, padding: 4, elevation: 15, shadowColor: !isPunchedIn ? '#10b981' : '#ef4444', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.5, shadowRadius: 20 }}
                  >
                    <View style={{ backgroundColor: palette.bgCard, borderRadius: 100, padding: 6 }}>
                      <LinearGradient 
                        colors={!isPunchedIn ? ['rgba(16,185,129,0.1)', 'rgba(16,185,129,0.2)'] : ['rgba(239,68,68,0.1)', 'rgba(239,68,68,0.2)']}
                        style={{ borderRadius: 100, paddingVertical: 20, paddingHorizontal: 30, alignItems: 'center', flexDirection: 'row', gap: 16 }}
                      >
                        {isLocating ? <ActivityIndicator color={!isPunchedIn ? '#10b981' : '#ef4444'} size="large" /> : <FontAwesome5 name="fingerprint" size={28} color={!isPunchedIn ? '#10b981' : '#ef4444'} />}
                        <View>
                          <Text style={{ color: !isPunchedIn ? '#10b981' : '#ef4444', fontSize: 22, fontWeight: '900', letterSpacing: 1 }}>
                            {isLocating ? 'LOCATING...' : (!isPunchedIn ? 'PUNCH IN' : 'PUNCH OUT')}
                          </Text>
                          <Text style={{ color: palette.textSecondary, fontSize: 13, fontWeight: '700' }}>
                            {isLocating ? 'Verifying GPS & Network' : (!isPunchedIn ? 'Start your shift/session' : 'End your current session')}
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Time Stats */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 32 }}>
                 <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: palette.textSecondary, fontSize: 11, fontWeight: '700' }}>TOTAL WORKED</Text>
                    <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: '800' }}>{formatMins(todayTotalMinutes)}</Text>
                 </View>
                 <View style={{ width: 1, backgroundColor: palette.border }} />
                 <View style={{ alignItems: 'center' }}>
                    <Text style={{ color: palette.textSecondary, fontSize: 11, fontWeight: '700' }}>OVERTIME</Text>
                    <Text style={{ color: todayOT > 0 ? palette.success : palette.textPrimary, fontSize: 16, fontWeight: '800' }}>{formatMins(todayOT)}</Text>
                 </View>
              </View>

              {/* Online Team Members Widget */}
              <View style={{ marginBottom: 24 }}>
                 <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Online in your Team <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: palette.success, marginLeft: 8}} /></Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
                    {onlineTeam.length === 0 ? (
                      <Text style={{ color: palette.textSecondary, fontStyle: 'italic', marginTop: 8 }}>No other team members online right now.</Text>
                    ) : (
                      onlineTeam.map((member, idx) => {
                        const colors = ['#3b82f6', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6'];
                        const color = colors[idx % colors.length];
                        return (
                          <View key={member.id} style={{ alignItems: 'center', width: 70 }}>
                            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: color, justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 2, borderColor: palette.bgApp }}>
                              <Text style={{ color: '#fff', fontSize: 20, fontWeight: '800' }}>{member.name.charAt(0).toUpperCase()}</Text>
                              <View style={{ position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: palette.success, borderWidth: 2, borderColor: palette.bgApp }} />
                            </View>
                            <Text style={{ color: palette.textPrimary, fontSize: 12, fontWeight: '700', textAlign: 'center' }} numberOfLines={1}>{member.name.split(' ')[0]}</Text>
                            <Text style={{ color: palette.textSecondary, fontSize: 10, fontWeight: '600' }} numberOfLines={1}>{member.role || 'Employee'}</Text>
                          </View>
                        );
                      })
                    )}
                 </ScrollView>
              </View>

              {/* Intelligent Geofence Indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 32, backgroundColor: palette.bgInput, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: palette.border }}>
                <Ionicons name="shield-checkmark" size={18} color={palette.success} style={{ marginRight: 8 }} />
                <Text style={{ color: palette.textSecondary, fontSize: 14, fontWeight: '600' }}>Verified Network & GPS Zone</Text>
              </View>

              {/* Company Announcements (New Feature) */}
              <View style={[styles.announcementCard, { backgroundColor: palette.bgInput, borderColor: palette.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="megaphone" size={18} color={palette.warning} />
                  <Text style={{ color: palette.textPrimary, fontWeight: '800', fontSize: 15, marginLeft: 8 }}>Company Update</Text>
                </View>
                <Text style={{ color: palette.textSecondary, fontSize: 13, lineHeight: 20 }}>
                  Diwali holidays have been declared from Nov 12. Wishing everyone a happy and safe festive season! 🎉
                </Text>
              </View>

              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>Recent Activity</Text>
              {history.slice(0, 3).map((item, idx) => (
                <View key={idx} style={[styles.historyCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow }]}>
                  <View style={[styles.historyDateBox, { backgroundColor: palette.bgInput }]}>
                    <Text style={{ color: palette.primary, fontWeight: '800', fontSize: 18 }}>{new Date(item.att_date).getDate()}</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' }}>{new Date(item.att_date).toLocaleString('default', { month: 'short' })}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={{ color: palette.success, fontWeight: '700', fontSize: 13, marginBottom: 4 }}>IN: {format12Hour(new Date(item.check_in))}</Text>
                    {item.check_out && <Text style={{ color: palette.danger, fontWeight: '700', fontSize: 13 }}>OUT: {format12Hour(new Date(item.check_out))}</Text>}
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'History' && (
            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} tintColor={palette.primary} />}>
              <Header title="Attendance Log" />
              <View style={{ marginBottom: 24 }}>
                <Text style={{ color: palette.textSecondary, fontSize: 14, fontWeight: '600' }}>Your timeline for the last 30 days.</Text>
              </View>
              
              {history.map((item, idx) => (
                <View key={idx} style={[styles.historyCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, padding: 20, marginBottom: 16, height: 'auto' }]}>
                  <View style={[styles.historyDateBox, { backgroundColor: palette.bgInput, width: 64, height: 64, borderRadius: 20 }]}>
                    <Text style={{ color: palette.primary, fontWeight: '900', fontSize: 22 }}>{new Date(item.att_date).getDate()}</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' }}>{new Date(item.att_date).toLocaleString('default', { month: 'short' })}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 20 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                      <Text style={{ color: palette.textPrimary, fontWeight: '800', fontSize: 16 }}>{new Date(item.att_date).toLocaleDateString('en-US', { weekday: 'long' })}</Text>
                    <View style={{ backgroundColor: item.status === 'LATE' ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                        <Text style={{ color: item.status === 'LATE' ? palette.warning : palette.success, fontWeight: '800', fontSize: 11 }}>{item.status}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <View>
                        <Text style={{ color: palette.textSecondary, fontSize: 11, fontWeight: '700' }}>IN</Text>
                        <Text style={{ color: palette.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 2 }}>{item.check_in ? format12Hour(new Date(item.check_in)) : "--:--"}</Text>
                      </View>
                      <View>
                        <Text style={{ color: palette.textSecondary, fontSize: 11, fontWeight: '700' }}>OUT</Text>
                        <Text style={{ color: palette.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 2 }}>{item.check_out ? format12Hour(new Date(item.check_out)) : "--:--"}</Text>
                      </View>
                    </View>
                    <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: palette.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: palette.textSecondary, fontSize: 12, fontWeight: '600' }} numberOfLines={1}><Ionicons name="location-outline" size={12}/> {item.check_in_location?.substring(0, 18) || 'Unknown'}</Text>
                      <Text style={{ color: palette.primary, fontSize: 14, fontWeight: '900' }}>{formatMins(item.total_minutes)}</Text>
                    </View>
                  </View>
                </View>
              ))}
              {history.length === 0 && <Text style={{ color: palette.textSecondary, textAlign: 'center', marginTop: 40 }}>No attendance history found.</Text>}
            </ScrollView>
          )}

          {/* TAB: LEAVES */}
          {activeTab === 'Leaves' && (
            <View style={{ flex: 1 }}>
              <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} tintColor={palette.primary} />}>
                <Header title="Leave Requests" />
                <TouchableOpacity activeOpacity={0.8} onPress={() => setLeaveModalVisible(true)}>
                  <LinearGradient colors={['#4f46e5', '#7c3aed']} style={styles.applyLeaveBtn} start={{x:0, y:0}} end={{x:1, y:1}}>
                    <Ionicons name="add" size={24} color="#fff" />
                    <Text style={styles.applyLeaveText}>Request Time Off</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {myLeaves.length === 0 ? (
                  <Text style={{ color: palette.textSecondary, textAlign: 'center', marginTop: 40 }}>No leave requests found.</Text>
                ) : (
                  myLeaves.map((leave, idx) => (
                    <View key={idx} style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={{ color: palette.textPrimary, fontWeight: '800', fontSize: 16 }}>{leave.leave_type}</Text>
                        <View style={[styles.badge, { backgroundColor: leave.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : leave.status === 'REJECTED' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                          <Text style={{ fontSize: 11, fontWeight: '800', color: leave.status === 'APPROVED' ? palette.success : leave.status === 'REJECTED' ? palette.danger : palette.warning }}>{leave.status}</Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Ionicons name="calendar" size={14} color={palette.primary} />
                        <Text style={{ color: palette.textSecondary, fontSize: 14, marginLeft: 8, fontWeight: '500' }}>
                          {new Date(leave.start_date).toLocaleDateString()}  →  {new Date(leave.end_date).toLocaleDateString()}
                        </Text>
                      </View>
                      {leave.reason ? <Text style={{ color: palette.textSecondary, fontSize: 14, fontStyle: 'italic', backgroundColor: palette.bgInput, padding: 12, borderRadius: 8 }}>"{leave.reason}"</Text> : null}
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* TAB: PAYSLIPS */}
          {activeTab === 'Payslips' && (
            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} tintColor={palette.primary} />}>
              <Header title="My Payslips" />

              {payslips.length === 0 ? (
                <View style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, alignItems: 'center', paddingVertical: 40 }]}>
                  <Ionicons name="receipt-outline" size={48} color={palette.textSecondary} style={{ marginBottom: 16 }} />
                  <Text style={{ color: palette.textSecondary, fontSize: 16 }}>No payslips available yet.</Text>
                </View>
              ) : (
                payslips.map((slip, idx) => (
                  <View key={idx} style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                        <Ionicons name="document-text" size={24} color={palette.primary} />
                      </View>
                      <View>
                        <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: '800' }}>{slip.month} {slip.year}</Text>
                        <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 4 }}>Uploaded: {new Date(slip.created_at).toLocaleDateString()}</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => Linking.openURL(`${api.defaults.baseURL}${slip.file_path}`)} style={{ padding: 8 }}>
                      <Ionicons name="download-outline" size={24} color={palette.primary} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          )}

          {/* TAB: OT INFO */}
          {activeTab === 'OT Info' && (
            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} tintColor={palette.primary} />}>
              <Header title="Overtime Settings" />
              
              {/* Standard Work Hours Card */}
              <View style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="time" size={22} color={palette.primary} />
                  </View>
                  <View>
                    <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: '800' }}>Standard Work Hours</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 2 }}>Daily shift duration</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: palette.bgInput, padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: palette.primary }}>
                  <Text style={{ color: palette.textPrimary, fontSize: 24, fontWeight: '900' }}>{otSettings.standard_hours}</Text>
                  <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 4 }}>hours per day</Text>
                </View>
              </View>

              {/* OT Rate Multiplier Card */}
              <View style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="trending-up" size={22} color={palette.success} />
                  </View>
                  <View>
                    <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: '800' }}>OT Rate Multiplier</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 2 }}>Additional payment rate</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: palette.bgInput, padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: palette.success }}>
                  <Text style={{ color: palette.textPrimary, fontSize: 24, fontWeight: '900' }}>{otSettings.ot_rate_multiplier}x</Text>
                  <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 4 }}>of regular hourly rate</Text>
                </View>
              </View>

              {/* OT Applicable From Card */}
              <View style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(245, 158, 11, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="flash" size={22} color="#f59e0b" />
                  </View>
                  <View>
                    <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: '800' }}>OT Kicks In After</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 2 }}>Threshold for overtime</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: palette.bgInput, padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#f59e0b' }}>
                  <Text style={{ color: palette.textPrimary, fontSize: 24, fontWeight: '900' }}>
                    {Math.floor(otSettings.ot_applicable_from_minutes / 60)}h {otSettings.ot_applicable_from_minutes % 60}m
                  </Text>
                  <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 4 }}>per day</Text>
                </View>
              </View>

              {/* Max Daily OT Card */}
              <View style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="alert-circle" size={22} color={palette.danger} />
                  </View>
                  <View>
                    <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: '800' }}>Max Daily OT</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 2 }}>Daily overtime limit</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: palette.bgInput, padding: 12, borderRadius: 12, borderLeftWidth: 3, borderLeftColor: palette.danger }}>
                  <Text style={{ color: palette.textPrimary, fontSize: 24, fontWeight: '900' }}>
                    {Math.floor(otSettings.max_daily_ot_minutes / 60)}h {otSettings.max_daily_ot_minutes % 60}m
                  </Text>
                  <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 4 }}>maximum per day</Text>
                </View>
              </View>

              {/* Weekly Off Days Card */}
              <View style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, marginBottom: 16 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(99, 102, 241, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="calendar" size={22} color={palette.primary} />
                  </View>
                  <View>
                    <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: '800' }}>Weekly Off Days</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 2 }}>No work scheduled</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: palette.bgInput, padding: 12, borderRadius: 12 }}>
                  <Text style={{ color: palette.textPrimary, fontSize: 14, fontWeight: '800', lineHeight: 22 }}>
                    {otSettings.weekly_off_days}
                  </Text>
                </View>
              </View>

              {/* Payment Condition Card */}
              <View style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow, marginBottom: 32 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name="wallet" size={22} color={palette.success} />
                  </View>
                  <View>
                    <Text style={{ color: palette.textPrimary, fontSize: 16, fontWeight: '800' }}>Payment Condition</Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12, marginTop: 2 }}>OT eligibility rule</Text>
                  </View>
                </View>
                <View style={{ backgroundColor: palette.bgInput, padding: 12, borderRadius: 12 }}>
                  <Text style={{ color: palette.textPrimary, fontSize: 14, fontWeight: '800', lineHeight: 22 }}>
                    {otSettings.ot_payment_condition}
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}
          {/* TAB: HELPDESK */}
          {activeTab === 'Helpdesk' && (
            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} tintColor={palette.primary} />}>
              <Header title="Support Desk" />
              
              <TouchableOpacity activeOpacity={0.8} onPress={() => Alert.alert("Coming Soon", "Create Ticket module will be available in next update.")}>
                <LinearGradient colors={['#3b82f6', '#2563eb']} style={styles.applyLeaveBtn} start={{x:0, y:0}} end={{x:1, y:1}}>
                  <Ionicons name="add" size={24} color="#fff" />
                  <Text style={styles.applyLeaveText}>Raise New Ticket</Text>
                </LinearGradient>
              </TouchableOpacity>

              <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>My Tickets</Text>
              
              {myTickets.map((ticket, idx) => (
                <View key={idx} style={[styles.leaveCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ color: palette.primary, fontWeight: '800', fontSize: 13 }}>{ticket.id}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: ticket.status === 'RESOLVED' ? palette.success : palette.warning }}>
                      {ticket.status}
                    </Text>
                  </View>
                  <Text style={{ color: palette.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: 12 }}>{ticket.title}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: palette.textSecondary, fontSize: 13, fontWeight: '600' }}>Priority: <Text style={{color: ticket.priority === 'High' ? palette.danger : palette.textSecondary}}>{ticket.priority}</Text></Text>
                    <Text style={{ color: palette.textSecondary, fontSize: 12 }}>{ticket.date}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          {/* TAB: PROFILE */}
          {activeTab === 'Profile' && (
            <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[palette.primary]} tintColor={palette.primary} />}>
              <Header title="Settings" />
              
              <View style={[styles.profileCard, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow }]}>
                <LinearGradient colors={['#6366f1', '#a855f7']} style={styles.profileAvatar}>
                  <Text style={{ fontSize: 36, fontWeight: '800', color: '#fff' }}>{profile.name ? profile.name.charAt(0) : "E"}</Text>
                </LinearGradient>
                <Text style={[styles.profileName, { color: palette.textPrimary }]}>{profile.name}</Text>
                <Text style={[styles.profileCode, { color: palette.textSecondary }]}>{profile.emp_code}</Text>
                
                <View style={[styles.divider, { backgroundColor: palette.border, marginVertical: 24, width: '100%' }]} />
                
                <View style={styles.profileDetailRow}>
                  <View style={[styles.profileIconBox, { backgroundColor: palette.bgInput }]}><Ionicons name="briefcase" size={18} color={palette.primary} /></View>
                  <Text style={[styles.profileDetailText, { color: palette.textPrimary }]}>{profile.department || "General Department"}</Text>
                </View>
                <View style={styles.profileDetailRow}>
                  <View style={[styles.profileIconBox, { backgroundColor: palette.bgInput }]}><Ionicons name="medal" size={18} color={palette.success} /></View>
                  <Text style={[styles.profileDetailText, { color: palette.textPrimary }]}>{profile.designation || "Employee"}</Text>
                </View>
              </View>

            <TouchableOpacity activeOpacity={0.8} style={[styles.logoutBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={handleLogout}>
                <Ionicons name="log-out" size={20} color={palette.danger} />
                <Text style={{ color: palette.danger, fontWeight: '800', fontSize: 16, marginLeft: 10 }}>Sign Out</Text>
              </TouchableOpacity>
            </ScrollView>
          )}

      </Animated.View>

      {/* Floating Bottom Tab Bar */}
      <View style={[styles.tabBar, { bottom: tabBarBottom, backgroundColor: palette.tabBg, borderColor: palette.border, shadowColor: palette.shadow, paddingHorizontal: 0 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, alignItems: 'center', flexGrow: 1, justifyContent: 'space-between' }}>
          {['Home', 'History', 'Leaves', 'Payslips', 'OT Info', 'Helpdesk', 'Profile'].map((tab) => {
            const isActive = activeTab === tab;
            let iconName = "";
            if (tab === 'Home') iconName = isActive ? "grid" : "grid-outline";
            if (tab === 'History') iconName = isActive ? "time" : "time-outline";
            if (tab === 'Leaves') iconName = isActive ? "calendar" : "calendar-outline";
            if (tab === 'Payslips') iconName = isActive ? "receipt" : "receipt-outline";
            if (tab === 'OT Info') iconName = isActive ? "flash" : "flash-outline";
            if (tab === 'Helpdesk') iconName = isActive ? "headset" : "headset-outline";
            if (tab === 'Profile') iconName = isActive ? "person" : "person-outline";

            return (
              <TouchableOpacity key={tab} style={[styles.tabItem, { minWidth: 70, paddingHorizontal: 4 }]} onPress={() => setActiveTab(tab)}>
                <Ionicons name={iconName} size={24} color={isActive ? palette.primary : palette.textSecondary} />
                {isActive && <Text style={[styles.tabText, { color: palette.primary }]} numberOfLines={1}>{tab}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Advanced Leave Request Modal */}
      <Modal visible={leaveModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          {/* ScrollView Wraps the ENTIRE modal content to fix keyboard bug */}
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={[styles.leaveModalContent, { backgroundColor: palette.bgCard, borderColor: palette.border, shadowColor: palette.shadow }]}>
              
              <View style={{ width: 40, height: 5, backgroundColor: palette.border, borderRadius: 10, alignSelf: 'center', marginBottom: 20 }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <Text style={{ fontSize: 24, fontWeight: '800', color: palette.textPrimary }}>Request Time Off</Text>
                <TouchableOpacity onPress={() => setLeaveModalVisible(false)} style={{ backgroundColor: palette.bgInput, padding: 8, borderRadius: 20 }}>
                  <Ionicons name="close" size={24} color={palette.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Start Date (YYYY-MM-DD)</Text>
                <TextInput style={[styles.modalInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.bgInput }]} placeholder="2024-05-15" placeholderTextColor={palette.textSecondary} value={leaveForm.start_date} onChangeText={(t) => setLeaveForm({...leaveForm, start_date: t})} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>End Date (YYYY-MM-DD)</Text>
                <TextInput style={[styles.modalInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.bgInput }]} placeholder="2024-05-16" placeholderTextColor={palette.textSecondary} value={leaveForm.end_date} onChangeText={(t) => setLeaveForm({...leaveForm, end_date: t})} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Leave Type</Text>
                <TextInput style={[styles.modalInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.bgInput }]} value={leaveForm.leave_type} onChangeText={(t) => setLeaveForm({...leaveForm, leave_type: t})} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: palette.textSecondary }]}>Reason</Text>
                <TextInput style={[styles.modalInput, { color: palette.textPrimary, borderColor: palette.border, backgroundColor: palette.bgInput, height: 100, textAlignVertical: 'top' }]} multiline placeholder="Optional reason..." placeholderTextColor={palette.textSecondary} value={leaveForm.reason} onChangeText={(t) => setLeaveForm({...leaveForm, reason: t})} />
              </View>

              <TouchableOpacity style={{ marginTop: 10 }} activeOpacity={0.8} onPress={submitLeave} disabled={isApplyingLeave}>
                <LinearGradient colors={['#4f46e5', '#7c3aed']} style={[styles.primaryBtn, { borderRadius: 16 }]} start={{x:0, y:0}} end={{x:1, y:1}}>
                  {isApplyingLeave ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Submit Request</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // Login
  loginCard: { borderRadius: 32, padding: 32, borderWidth: 1, elevation: 20 },
  loginLogoContainer: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  loginTitle: { fontSize: 36, fontWeight: "900", marginBottom: 8, letterSpacing: -1 },
  loginSubTitle: { fontSize: 16, marginBottom: 32, fontWeight: '500' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  loginInput: { fontSize: 16, padding: 18, borderRadius: 16, borderWidth: 1, fontWeight: '500' },
  primaryBtn: { borderRadius: 16, paddingVertical: 20, alignItems: "center", marginTop: 10 },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, letterSpacing: 0.5 },

  // Header
  loginCardCompact: { borderRadius: 24 },
  loginInputCompact: { padding: 14, fontSize: 15 },
  divider: { height: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 4 },
  headerTitle: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  iconBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, elevation: 5 },

  // Dashboard
  proStatCard: { flex: 1, padding: 16, borderRadius: 20, borderWidth: 1, elevation: 5 },
  clockContainer: { marginBottom: 24, alignItems: 'flex-start' },
  clockText: { fontSize: 36, fontWeight: "900", letterSpacing: -1, lineHeight: 42 },
  dateText: { fontSize: 13, fontWeight: "800", marginTop: 4, letterSpacing: 1, textTransform: 'uppercase' },
  
  // New Pulse Orb UI
  pulseOrb: { width: width - 80, height: width - 80, maxWidth: 300, maxHeight: 300, borderRadius: 150, justifyContent: 'center', alignItems: 'center', elevation: 20 },
  pulseOrbInner: { width: '85%', height: '85%', borderRadius: 150, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  quoteCard: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 24 },

  sectionTitle: { fontSize: 20, fontWeight: "800", marginBottom: 20, letterSpacing: -0.5 },
  historyCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 12, elevation: 5 },
  historyDateBox: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  announcementCard: { padding: 16, borderRadius: 20, borderWidth: 1, marginBottom: 32, borderLeftWidth: 4, borderLeftColor: '#f59e0b' },

  // Leaves
  balanceCard: { flex: 1, padding: 16, borderRadius: 16, borderWidth: 1 },
  applyLeaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, borderRadius: 20, marginBottom: 32 },
  applyLeaveText: { color: '#fff', fontWeight: '800', fontSize: 16, marginLeft: 10 },
  leaveCard: { padding: 24, borderRadius: 24, borderWidth: 1, marginBottom: 16, elevation: 5 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },

  // Timesheet
  timesheetHeader: { padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20, flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, padding: 24, borderRadius: 24, borderWidth: 1, alignItems: 'center', marginBottom: 16, elevation: 5 },
  statValue: { fontSize: 32, fontWeight: '900', marginBottom: 8, letterSpacing: -1 },
  statLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // Profile
  profileCard: { padding: 32, borderRadius: 32, borderWidth: 1, alignItems: 'center', marginBottom: 24, elevation: 10 },
  profileAvatar: { width: 100, height: 100, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  profileName: { fontSize: 28, fontWeight: '800', marginBottom: 4, letterSpacing: -1 },
  profileCode: { fontSize: 16, fontWeight: '600' },
  profileDetailRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16, padding: 12, borderRadius: 16 },
  profileIconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  profileDetailText: { fontSize: 16, fontWeight: '600', marginLeft: 16 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 20, borderWidth: 1 },

  // Floating Tab Bar
  tabBar: { flexDirection: 'row', height: 64, paddingHorizontal: 8, position: 'absolute', left: 16, right: 16, borderRadius: 20, borderWidth: 1, elevation: 12 },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabText: { fontSize: 11, fontWeight: '800', marginTop: 4 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)" },
  actionModalContent: { margin: 24, marginTop: 'auto', marginBottom: 'auto', borderRadius: 32, padding: 32, borderWidth: 1, alignItems: 'center', elevation: 20 },
  leaveModalContent: { borderTopLeftRadius: 40, borderTopRightRadius: 40, padding: 32, borderWidth: 1, elevation: 20 },
  modalIconContainer: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: "900", marginBottom: 10, letterSpacing: -0.5 },
  locationInfo: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, width: '100%' },
  modalLocText: { fontSize: 14, fontWeight: "600", marginLeft: 12, flex: 1, lineHeight: 20 },
  modalBtn: { flex: 1, paddingVertical: 18, alignItems: "center", borderRadius: 16 },
  modalInput: { borderWidth: 1, borderRadius: 16, padding: 18, fontSize: 16, fontWeight: '500' }
});