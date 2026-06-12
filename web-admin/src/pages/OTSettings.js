﻿import React, { useState, useEffect } from "react";
import api from "../api";
import {
  Clock,
  Save,
  AlertCircle,
  CheckCircle2,
  Zap,
  Briefcase,
  TrendingUp,
} from "lucide-react";

export default function OTSettings({ theme }) {
  const [otSettings, setOtSettings] = useState({
    standard_hours: 9.0,
    shift_start_time: "09:00:00",
    shift_end_time: "18:00:00",
    late_grace_minutes: 0,
    ot_rate_multiplier: 1.5,
    ot_applicable_from_minutes: 540,
    max_daily_ot_minutes: 180,
    weekly_off_days: "Saturday,Sunday",
    ot_payment_condition: "Above standard hours",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState("");

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
        field === "max_daily_ot_minutes" ||
        field === "late_grace_minutes"
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
              background: `var(--primary)`,
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
                color: "var(--text-main)",
                margin: 0,
                letterSpacing: "-0.5px",
              }}
            >
              Overtime Settings
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                margin: "4px 0 0 0",
                fontSize: "14px",
              }}
            >
              Manage overtime rules, rates, and configurations
            </p>
          </div>
        </div>
      </div>

      {isSaved && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            borderLeft: `4px solid var(--success)`,
            borderRadius: "16px",
            marginBottom: "24px",
            color: "var(--success)",
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
            color: "var(--danger)",
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
            backgroundColor: "var(--bg-card)",
            borderRadius: "28px",
            padding: "28px",
            border: `1px solid var(--border)`,
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)",
            borderTop: `4px solid var(--primary)`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "16px",
                background: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Briefcase size={20} color="var(--primary)" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
              Work Hours Config
            </h3>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-muted)",
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
                border: `2px solid var(--border)`,
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "14px",
                fontWeight: "600",
                transition: "border-color 0.2s",
                boxSizing: 'border-box'
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "8px 0 0 0" }}>
              Currently set to {otSettings.standard_hours} hours
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Shift Start
              </label>
              <input
                type="time"
                value={String(otSettings.shift_start_time || "09:00").slice(0, 5)}
                onChange={(e) => handleChange("shift_start_time", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "16px",
                  border: `2px solid var(--border)`,
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: "var(--text-muted)",
                  marginBottom: "8px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Shift End
              </label>
              <input
                type="time"
                value={String(otSettings.shift_end_time || "18:00").slice(0, 5)}
                onChange={(e) => handleChange("shift_end_time", e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "16px",
                  border: `2px solid var(--border)`,
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Late Grace Minutes
            </label>
            <input
              type="number"
              step="5"
              min="0"
              value={otSettings.late_grace_minutes || 0}
              onChange={(e) => handleChange("late_grace_minutes", e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px",
                borderRadius: "16px",
                border: `2px solid var(--border)`,
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "14px",
                fontWeight: "600",
                boxSizing: 'border-box'
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "8px 0 0 0" }}>
              Employee late tab mark hoga jab check-in shift start + grace ke baad hoga.
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-muted)",
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
                border: `2px solid var(--border)`,
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "14px",
                fontWeight: "600",
                boxSizing: 'border-box'
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "8px 0 0 0" }}>
              {Math.floor(otSettings.ot_applicable_from_minutes / 60)}h{" "}
              {otSettings.ot_applicable_from_minutes % 60}m
            </p>
          </div>
        </div>

        {/* OT Calculation Card */}
        <div
          className="fade-in-up stagger-3 hover-lift"
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "28px",
            padding: "28px",
            border: `1px solid var(--border)`,
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)",
            borderTop: `4px solid var(--success)`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "16px",
                background: "rgba(16, 185, 129, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={20} color="var(--success)" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
              Calculation Rules
            </h3>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-muted)",
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
                border: `2px solid var(--border)`,
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "14px",
                fontWeight: "600",
                boxSizing: 'border-box'
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "8px 0 0 0" }}>
              {Math.round((otSettings.ot_rate_multiplier - 1) * 100)}% extra compensation
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-muted)",
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
                border: `2px solid var(--border)`,
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "14px",
                fontWeight: "600",
                boxSizing: 'border-box'
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "8px 0 0 0" }}>
              Maximum {Math.floor(otSettings.max_daily_ot_minutes / 60)}h{" "}
              {otSettings.max_daily_ot_minutes % 60}m per day
            </p>
          </div>
        </div>

        {/* Additional Settings Card */}
        <div
          className="fade-in-up stagger-4 hover-lift"
          style={{
            backgroundColor: "var(--bg-card)",
            borderRadius: "28px",
            padding: "28px",
            border: `1px solid var(--border)`,
            boxShadow: "0 20px 40px -20px rgba(0,0,0,0.05)",
            borderTop: `4px solid var(--warning)`,
            backdropFilter: 'blur(20px)'
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "16px",
                background: "rgba(245, 158, 11, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Zap size={20} color="var(--warning)" />
            </div>
            <h3 style={{ fontSize: "16px", fontWeight: "800", color: "var(--text-main)", margin: 0 }}>
              Additional Settings
            </h3>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-muted)",
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
                border: `2px solid var(--border)`,
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "14px",
                fontWeight: "500",
                boxSizing: 'border-box'
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "8px 0 0 0" }}>
              Comma-separated (e.g., Saturday,Sunday)
            </p>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "700",
                color: "var(--text-muted)",
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
                border: `2px solid var(--border)`,
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "14px",
                fontWeight: "500",
                boxSizing: 'border-box'
              }}
            />
            <p style={{ color: "var(--text-muted)", fontSize: "12px", margin: "8px 0 0 0" }}>
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
          borderTop: `1px solid var(--border)`,
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
            background: `var(--primary)`,
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
            boxShadow: `0 4px 12px rgba(0,0,0,0.1)`,
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
            border: `2px solid var(--border)`,
            backgroundColor: "var(--bg-input)",
            color: "var(--text-main)",
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
