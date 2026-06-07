import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { LogOut, Shield, Crown, Zap } from "lucide-react";

export default function Billing() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
    if (!document.getElementById("razorpay-script")) {
      const script = document.createElement("script");
      script.id = "razorpay-script";
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await api.get("/billing/status");
      setStatus(res.data);
    } catch (err) {
      console.error("Failed to fetch billing status", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const buyPlan = async (plan) => {
    if (processingPlan) return;

    try {
      setProcessingPlan(plan);
      const orderRes = await api.post("/billing/create-order", { plan });
      const { orderId, amount, currency, rzpKey } = orderRes.data;

      if (!rzpKey) {
        alert("Payment gateway not configured. Please contact support.");
        setProcessingPlan(null);
        return;
      }

      if (!window.Razorpay) {
        alert("Payment SDK loading. Please wait a moment and try again.");
        setProcessingPlan(null);
        return;
      }

      const options = {
        key: rzpKey,
        amount,
        currency,
        name: "PulseHR",
        description: `${plan === "YEARLY" ? "Yearly" : "Monthly"} Subscription`,
        order_id: orderId,
        handler: async function (response) {
          try {
            const verifyRes = await api.post("/billing/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            alert(verifyRes.data.message || "Payment Successful!");
            await fetchStatus();
            navigate("/dashboard");
          } catch (err) {
            console.error("Verification failed", err);
            alert(err?.response?.data?.message || "Payment verification failed. Please contact support.");
          } finally {
            setProcessingPlan(null);
          }
        },
        modal: {
          ondismiss: () => setProcessingPlan(null),
        },
        theme: { color: "#6366f1" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert(response.error?.description || "Payment failed. Please try again.");
        setProcessingPlan(null);
      });
      rzp.open();
      setProcessingPlan(null);
    } catch (err) {
      console.error("Order creation failed", err);
      alert(err?.response?.data?.message || "Failed to initiate payment. Please try again.");
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>Loading billing status...</div>
      </div>
    );
  }

  const isExpired = status?.subscription_status === "EXPIRED";
  const isTrial = status?.subscription_status === "TRIAL";
  const trialDaysLeft = status?.trial_days_left ?? 30;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, color: "var(--text-main)" }}>Subscription & Billing</h1>
          <p style={{ color: "var(--text-muted)", marginTop: 8 }}>Manage your workspace plan</p>
        </div>
        <button className="btn btn-outline" onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {isExpired && (
        <div style={styles.expiredBanner}>
          <Shield size={24} />
          <div>
            <strong>Access Blocked</strong>
            <p style={{ margin: "4px 0 0" }}>Your free trial or subscription has expired. Purchase a plan below to restore full access.</p>
          </div>
        </div>
      )}

      {isTrial && trialDaysLeft <= 7 && !isExpired && (
        <div style={styles.warningBanner}>
          <Zap size={20} />
          <span>Your free trial ends in <strong>{trialDaysLeft} days</strong>. Upgrade now to avoid interruption.</span>
        </div>
      )}

      <div style={styles.card}>
        <h2 style={{ marginTop: 0, color: "var(--text-main)" }}>Current Status</h2>
        <div style={styles.statusGrid}>
          <div style={styles.statusItem}>
            <p style={styles.label}>Plan</p>
            <p style={styles.value}>{status?.subscription_plan || "FREE"}</p>
          </div>
          <div style={styles.statusItem}>
            <p style={styles.label}>Status</p>
            <p style={{ ...styles.value, color: isExpired ? "var(--danger)" : "var(--success)" }}>
              {status?.subscription_status || "UNKNOWN"}
            </p>
          </div>
          <div style={styles.statusItem}>
            <p style={styles.label}>Trial Ends</p>
            <p style={styles.value}>
              {status?.trial_ends_at
                ? `${new Date(status.trial_ends_at).toLocaleDateString()} (${trialDaysLeft} days left)`
                : "30 Days"}
            </p>
          </div>
          <div style={styles.statusItem}>
            <p style={styles.label}>Subscription Ends</p>
            <p style={styles.value}>
              {status?.subscription_ends_at
                ? new Date(status.subscription_ends_at).toLocaleDateString()
                : "N/A"}
            </p>
          </div>
        </div>

        {status?.first_purchase_done === 0 && (
          <div style={styles.offer}>
            Special Offer: Get <strong>1 Month FREE</strong> on your first purchase!
          </div>
        )}
      </div>

      <h2 style={{ color: "var(--text-main)", marginBottom: 24 }}>Choose a Plan</h2>
      <div style={styles.pricingGrid}>
        <div style={styles.pricingCard}>
          <Zap size={32} color="var(--primary)" style={{ marginBottom: 12 }} />
          <h3 style={{ color: "var(--text-main)" }}>Monthly Plan</h3>
          <p style={styles.price}>
            ₹499 <span style={styles.period}>/ month</span>
          </p>
          <ul style={styles.features}>
            <li>Up to 50 Employees</li>
            <li>Attendance Tracking</li>
            <li>Payroll & Leave Management</li>
            <li>Notice Board & Reports</li>
          </ul>
          <button
            className="btn btn-primary"
            style={styles.buyBtn}
            disabled={processingPlan !== null}
            onClick={() => buyPlan("MONTHLY")}
          >
            {processingPlan === "MONTHLY" ? "Processing..." : "Buy Monthly"}
          </button>
        </div>

        <div style={{ ...styles.pricingCard, ...styles.pricingCardFeatured }}>
          <div style={styles.popularBadge}>
            <Crown size={14} /> Best Value
          </div>
          <Crown size={32} color="var(--primary)" style={{ marginBottom: 12 }} />
          <h3 style={{ color: "var(--text-main)" }}>Yearly Plan</h3>
          <p style={styles.price}>
            ₹4999 <span style={styles.period}>/ year</span>
          </p>
          <ul style={styles.features}>
            <li>Save ₹989 per year!</li>
            <li>Unlimited Employees</li>
            <li>All Monthly features</li>
            <li>Priority Support</li>
          </ul>
          <button
            className="btn btn-primary"
            style={styles.buyBtn}
            disabled={processingPlan !== null}
            onClick={() => buyPlan("YEARLY")}
          >
            {processingPlan === "YEARLY" ? "Processing..." : "Buy Yearly"}
          </button>
        </div>
      </div>

      <p style={styles.secureNote}>
        <Shield size={14} /> Payments secured by Razorpay. Your card details are never stored on our servers.
      </p>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "40px 20px",
    fontFamily: "var(--font-family, sans-serif)",
  },
  loadingBox: {
    textAlign: "center",
    padding: 60,
    color: "var(--text-muted)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "32px",
    flexWrap: "wrap",
    gap: 16,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "1px solid var(--border)",
    padding: "8px 16px",
    color: "var(--text-main)",
    cursor: "pointer",
  },
  expiredBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: 16,
    padding: 20,
    background: "var(--danger-bg)",
    color: "var(--danger-text)",
    borderRadius: 16,
    marginBottom: 24,
    border: "1px solid var(--danger)",
  },
  warningBanner: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: 16,
    background: "var(--warning-bg)",
    color: "var(--warning-text)",
    borderRadius: 12,
    marginBottom: 24,
  },
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "24px",
    padding: "30px",
    marginBottom: "40px",
    boxShadow: "var(--shadow-md)",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  statusItem: {
    padding: 16,
    background: "var(--bg-input)",
    borderRadius: 12,
    border: "1px solid var(--border)",
  },
  label: {
    fontSize: "13px",
    color: "var(--text-muted)",
    margin: "0 0 8px 0",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  value: {
    fontSize: "18px",
    fontWeight: "700",
    margin: 0,
    color: "var(--text-main)",
  },
  offer: {
    marginTop: "20px",
    padding: "16px",
    background: "var(--success-bg)",
    color: "var(--success-text)",
    borderRadius: "12px",
    fontWeight: "600",
    textAlign: "center",
  },
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "30px",
  },
  pricingCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "24px",
    padding: "40px",
    textAlign: "center",
    position: "relative",
    boxShadow: "var(--shadow-md)",
    transition: "transform 0.2s",
  },
  pricingCardFeatured: {
    border: "2px solid var(--primary)",
    transform: "scale(1.02)",
  },
  popularBadge: {
    position: "absolute",
    top: "-14px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--primary)",
    color: "white",
    padding: "6px 18px",
    borderRadius: "99px",
    fontSize: "12px",
    fontWeight: "bold",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  price: {
    fontSize: "40px",
    fontWeight: "800",
    color: "var(--text-main)",
    margin: "20px 0",
  },
  period: {
    fontSize: "16px",
    color: "var(--text-muted)",
    fontWeight: "500",
  },
  features: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 30px 0",
    textAlign: "left",
    color: "var(--text-muted)",
    lineHeight: "2.2",
  },
  buyBtn: {
    width: "100%",
    padding: "16px",
    fontSize: "16px",
  },
  secureNote: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    color: "var(--text-muted)",
    fontSize: 13,
  },
};
