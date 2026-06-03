import React, { useState, useEffect } from "react";
import api from "../api";
import {
  Clock,
  Save,
  AlertCircle,
  CheckCircle2,
  Palette,
  Zap,
  Briefcase,
  TrendingUp,
} from "lucide-react";

const THEMES = {
  professional: {
    primary: "#6366f1",
    secondary: "#818cf8",
    accent: "#4f46e5",
    light: "rgba(99, 102, 241, 0.1)",
  },
  vibrant: {
    primary: "#ec4899",
    secondary: "#f472b6",
    accent: "#ec0000",
    light: "rgba(236, 72, 153, 0.1)",
  },
  ocean: {
    primary: "#0ea5e9",
    secondary: "#06b6d4",
    accent: "#0369a1",
    light: "rgba(14, 165, 233, 0.1)",
  },
  forest: {
    primary: "#10b981",
    secondary: "#34d399",
    accent: "#047857",
    light: "rgba(16, 185, 129, 0.1)",
  },
  sunset: {
    primary: "#f97316",
    secondary: "#fb923c",
    accent: "#ea580c",
    light: "rgba(249, 115, 22, 0.1)",
  },
  midnight: {
    primary: "#1e293b",
    secondary: "#334155",
    accent: "#0f172a",
    light: "rgba(30, 41, 59, 0.1)",
  },
};

export default function OTSettings({ theme }) {
  const [otSettings, setOtSettings] = useState({
    standard_hours: 9.0,
    ot_rate_multiplier: 1.5,
    ot_applicable_from_minutes: 540,
    max_daily_ot_minutes: 180,
    weekly_off_days: "Saturday,Sunday",
    ot_payment_condition: "Above standard hours",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("professional");

  useEffect(() => {
    loadOTSettings();
  }, []);

  const loadOTSettings = async () => {
    try {
      const response = await api.get("/ot-settings");
      setOtSettings(response.data);
    } catch (err) {
      console.error("Failed to load OT settings:", err);
    }
  };

  const handleChange = (field, value) => {
    setOtSettings((prev) => {
      let newValue = value;
      if (
        field === "ot_applicable_from_minutes" ||
        field === "max_daily_ot_minutes"
      ) {
        newValue = parseInt(value) || 0;
      } else if (field === "standard_hours" || field === "ot_rate_multiplier") {
        newValue = parseFloat(value) || 0;
      }
      return {
        ...prev,
        [field]: newValue,
      };
    });
    setIsSaved(false);
  };

  const handleSave = async () => {
    if (otSettings.standard_hours <= 0 || otSettings.ot_rate_multiplier <= 0) {
      setError("Standard hours and OT rate must be greater than 0");
      return;
    }

    setIsLoading(true);
    setError("");
    try {
      await api.put("/ot-settings", otSettings);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === "dark";
  const bgCard = isDark ? "#1e293b" : "#ffffff";
  const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
  const textSecondary = isDark ? "#94a3b8" : "#475569";
  const textTertiary = isDark ? "#64748b" : "#94a3b8";
  const borderColor = isDark ? "#334155" : "#e2e8f0";
  const bgInput = isDark ? "#0f172a" : "#f8fafc";
  const bgSecondary = isDark ? "#0f172a" : "#f9fafb";

  const currentTheme = THEMES[selectedTheme];

  return (
    <div className="fade-in" style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header Section */}
      <div className="fade-in-up stagger-1" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "16px",
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Clock size={24} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: textPrimary,
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Overtime Settings
            </h1>
            <p
              style={{
                color: textSecondary,
                margin: "4px 0 0 0",
                fontSize: "14px",
              }}
            >
              Manage overtime rules, rates, and configurations
            </p>
          </div>
        </div>
      </div>

      {/* Theme Selector */}
      <div
        style={{
          backgroundColor: bgCard,
          borderRadius: "28px",
          padding: "24px",
          marginBottom: "32px",
          border: `1px solid ${borderColor}`,
          boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)",
          backdropFilter: 'blur(20px)'
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <Palette size={20} color={currentTheme.primary} />
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: textPrimary, margin: 0 }}>
            Choose Theme
          </h3>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))",
            gap: "12px",
          }}
        >
          {Object.entries(THEMES).map(([themeName, themeColors]) => (
            <button
              key={themeName}
              onClick={() => setSelectedTheme(themeName)}
              style={{
                padding: "12px 16px",
                borderRadius: "16px",
                border:
                  selectedTheme === themeName
                    ? `2px solid ${themeColors.primary}`
                    : `1px solid ${borderColor}`,
                backgroundColor:
                  selectedTheme === themeName ? themeColors.light : bgSecondary,
                color: textPrimary,
                fontWeight: "600",
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.3s ease",
                textTransform: "capitalize",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow:
                  selectedTheme === themeName
                    ? `0 0 0 3px ${themeColors.light}`
                    : "none",
              }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
                }}
              />
              {themeName}
            </button>
          ))}
        </div>
      </div>

      {isSaved && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            backgroundColor: `${currentTheme.light}`,
            borderLeft: `4px solid ${currentTheme.primary}`,
            borderRadius: "16px",
            marginBottom: "24px",
            color: currentTheme.primary,
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          <CheckCircle2 size={20} />
          OT Settings saved successfully!
        </div>
      )}

      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderLeft: "4px solid #ef4444",
            borderRadius: "16px",
            marginBottom: "24px",
            color: "#ef4444",
            fontWeight: "600",
            fontSize: "14px",
          }}
        >
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {/* Work Hours Card */}
        <div
          className="fade-in-up stagger-2 hover-lift"
          style={{
            backgroundColor: bgCard,
            borderRadius: "28px",
            padding: "28px",
            border: `1px solid ${borderColor}`,
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)",
            borderTop: `4px solid ${currentTheme.primary}`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "16px",
                background: currentTheme.light,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Briefcase size={20} color={currentTheme.primary} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: textPrimary, margin: 0 }}>
              Work Hours Config
            </h3>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: textSecondary,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Standard Hours/Day
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={otSettings.standard_hours}
              onChange={(e) => handleChange("standard_hours", e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "16px",
                border: `2px solid ${borderColor}`,
                backgroundColor: bgInput,
                color: textPrimary,
                fontSize: "14px",
                fontWeight: "600",
                transition: "border-color 0.2s",
              }}
            />
            <p style={{ color: textTertiary, fontSize: "12px", margin: "8px 0 0 0" }}>
              Currently set to {otSettings.standard_hours} hours
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: textSecondary,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              OT Kicks In After
            </label>
            <input
              type="number"
              step="15"
              min="0"
              value={otSettings.ot_applicable_from_minutes}
              onChange={(e) => handleChange("ot_applicable_from_minutes", e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "16px",
                border: `2px solid ${borderColor}`,
                backgroundColor: bgInput,
                color: textPrimary,
                fontSize: "14px",
                fontWeight: "600",
              }}
            />
            <p style={{ color: textTertiary, fontSize: "12px", margin: "8px 0 0 0" }}>
              {Math.floor(otSettings.ot_applicable_from_minutes / 60)}h{" "}
              {otSettings.ot_applicable_from_minutes % 60}m
            </p>
          </div>
        </div>

        {/* OT Calculation Card */}
        <div
          className="fade-in-up stagger-3 hover-lift"
          style={{
            backgroundColor: bgCard,
            borderRadius: "28px",
            padding: "28px",
            border: `1px solid ${borderColor}`,
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)",
            borderTop: `4px solid ${currentTheme.secondary}`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "16px",
                background: currentTheme.light,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={20} color={currentTheme.secondary} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: textPrimary, margin: 0 }}>
              Calculation Rules
            </h3>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: textSecondary,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              OT Rate Multiplier
            </label>
            <input
              type="number"
              step="0.1"
              min="0.5"
              value={otSettings.ot_rate_multiplier}
              onChange={(e) => handleChange("ot_rate_multiplier", e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "16px",
                border: `2px solid ${borderColor}`,
                backgroundColor: bgInput,
                color: textPrimary,
                fontSize: "14px",
                fontWeight: "600",
              }}
            />
            <p style={{ color: textTertiary, fontSize: "12px", margin: "8px 0 0 0" }}>
              {Math.round((otSettings.ot_rate_multiplier - 1) * 100)}% extra compensation
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: textSecondary,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Max Daily OT Limit
            </label>
            <input
              type="number"
              step="15"
              min="0"
              value={otSettings.max_daily_ot_minutes}
              onChange={(e) => handleChange("max_daily_ot_minutes", e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "16px",
                border: `2px solid ${borderColor}`,
                backgroundColor: bgInput,
                color: textPrimary,
                fontSize: "14px",
                fontWeight: "600",
              }}
            />
            <p style={{ color: textTertiary, fontSize: "12px", margin: "8px 0 0 0" }}>
              Maximum {Math.floor(otSettings.max_daily_ot_minutes / 60)}h{" "}
              {otSettings.max_daily_ot_minutes % 60}m per day
            </p>
          </div>
        </div>

        {/* Additional Settings Card */}
        <div
          className="fade-in-up stagger-4 hover-lift"
          style={{
            backgroundColor: bgCard,
            borderRadius: "28px",
            padding: "28px",
            border: `1px solid ${borderColor}`,
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)",
            borderTop: `4px solid ${currentTheme.accent}`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "16px",
                background: currentTheme.light,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={20} color={currentTheme.accent} />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: textPrimary, margin: 0 }}>
              Additional Settings
            </h3>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: textSecondary,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Weekly Off Days
            </label>
            <input
              type="text"
              value={otSettings.weekly_off_days}
              onChange={(e) => handleChange("weekly_off_days", e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "16px",
                border: `2px solid ${borderColor}`,
                backgroundColor: bgInput,
                color: textPrimary,
                fontSize: "14px",
                fontWeight: "500",
              }}
            />
            <p style={{ color: textTertiary, fontSize: "12px", margin: "8px 0 0 0" }}>
              Comma-separated (e.g., Saturday,Sunday)
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: textSecondary,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Payment Condition
            </label>
            <input
              type="text"
              value={otSettings.ot_payment_condition}
              onChange={(e) => handleChange("ot_payment_condition", e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "16px",
                border: `2px solid ${borderColor}`,
                backgroundColor: bgInput,
                color: textPrimary,
                fontSize: "14px",
                fontWeight: "500",
              }}
            />
            <p style={{ color: textTertiary, fontSize: "12px", margin: "8px 0 0 0" }}>
              Describe OT eligibility criteria
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="fade-in-up stagger-5"
        style={{
          display: "flex",
          gap: "12px",
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: `1px solid ${borderColor}`,
        }}
      >
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="hover-lift hover-glow"
          style={{
            flex: 1,
            padding: "14px 24px",
            borderRadius: "50px",
            border: "none",
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.secondary})`,
            color: "#ffffff",
            fontWeight: "700",
            fontSize: "14px",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            opacity: isLoading ? 0.7 : 1,
            transform: !isLoading ? "translateY(0)" : "translateY(2px)",
            boxShadow: `0 4px 12px ${currentTheme.light}`,
          }}
        >
          <Save size={18} />
          {isLoading ? "Saving..." : "Save Settings"}
        </button>
        <button
          onClick={loadOTSettings}
          className="hover-lift"
          style={{
            padding: "14px 24px",
            borderRadius: "50px",
            border: `2px solid ${borderColor}`,
            backgroundColor: bgInput,
            color: textPrimary,
            fontWeight: "700",
            fontSize: "14px",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
