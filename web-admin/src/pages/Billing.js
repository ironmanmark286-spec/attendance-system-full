import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { LogOut } from "lucide-react";

export default function Billing() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStatus();
    // Load Razorpay Checkout Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
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
    try {
      setProcessing(true);
      // 1. Create Order on Backend
      const orderRes = await api.post("/billing/create-order", { plan });
      const { orderId, amount, currency, rzpKey: backendRzpKey } = orderRes.data;

      // 2. Open Razorpay Checkout
      const rzpKey = backendRzpKey || process.env.REACT_APP_RAZORPAY_KEY_ID;
      if (!rzpKey) {
        alert("Razorpay key not configured. Please set RAZORPAY_KEY_ID in backend environment.");
        return;
      }

      


      const options = {
        key: rzpKey,
        amount: amount,
        currency: currency,
        name: "Attendance System",
        description: `${plan} Subscription`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // 3. Verify Payment on Backend
            const verifyRes = await api.post("/billing/verify-payment", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan
            });
            alert(verifyRes.data.message || "Payment Successful!");
            fetchStatus(); // Refresh status
            // Redirect to dashboard if successful
            navigate("/dashboard");
          } catch (err) {
            console.error("Verification failed", err);
            alert(err?.response?.data?.message || "Payment verification failed. Please contact support.");
          }
        },

        prefill: {
          name: "Admin User",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        alert(response.error.description);
      });
      rzp.open();
    } catch (err) {
      console.error("Order creation failed", err);
      alert("Failed to initiate payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div style={styles.container}>Loading billing status...</div>;
  }

  const isExpired = status?.subscription_status === "EXPIRED";

  // Security: show only non-sensitive billing info



  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={{ margin: 0, color: 'var(--text-primary)' }}>Subscription & Billing</h1>
        <button className="btn btn-outline" onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={{marginTop: 0, color: 'var(--text-primary)'}}>Current Status</h2>
        <div style={styles.statusGrid}>
          <div>
            <p style={styles.label}>Plan</p>
            <p style={styles.value}>{status?.subscription_plan || "FREE"}</p>
          </div>
          <div>
            <p style={styles.label}>Status</p>
            <p style={{...styles.value, color: isExpired ? '#ef4444' : '#10b981'}}>
              {status?.subscription_status || "UNKNOWN"}
            </p>
          </div>

          <div>
            <p style={styles.label}>Trial Ends</p>
            <p style={styles.value}>
              {status?.trial_ends_at 
                ? `${new Date(status.trial_ends_at).toLocaleDateString()} (${Math.max(0, Math.ceil((new Date(status.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)))} Days Left)` 
                : "30 Days"}
            </p>
          </div>
          <div>
            <p style={styles.label}>Subscription Ends</p>
            <p style={styles.value}>
              {status?.subscription_ends_at ? new Date(status.subscription_ends_at).toLocaleDateString() : "N/A"}
            </p>
          </div>
        </div>
        
        {isExpired && (
          <div style={styles.alert}>
            Your subscription has expired! Please purchase a plan below to restore access to your workspace.
          </div>
        )}
        
        {status?.first_purchase_done === 0 && (
          <div style={styles.offer}>
            🎁 Special Offer: Get <strong>1 Month FREE</strong> instantly added to your first purchase!
          </div>
        )}
      </div>

      <h2 style={{color: 'var(--text-primary)'}}>Choose a Plan</h2>
      <div style={styles.pricingGrid}>
        <div style={styles.pricingCard}>
          <h3>Monthly Plan</h3>
          <p style={styles.price}>₹499 <span style={styles.period}>/ month</span></p>
          <ul style={styles.features}>
            <li>✔ Up to 50 Employees</li>
            <li>✔ Attendance Tracking</li>
            <li>✔ Payroll & Leave Management</li>
          </ul>
          <button 
            className="btn btn-primary" 
            style={styles.buyBtn} 
            disabled={processing}
            onClick={() => buyPlan("MONTHLY")}
          >
            {processing ? "Processing..." : "Buy Monthly"}
          </button>
        </div>

        <div style={{...styles.pricingCard, border: '2px solid var(--primary)'}}>
          <div style={styles.popularBadge}>Best Value</div>
          <h3>Yearly Plan</h3>
          <p style={styles.price}>₹4999 <span style={styles.period}>/ year</span></p>
          <ul style={styles.features}>
            <li>✔ Save ₹989 per year!</li>
            <li>✔ Unlimited Employees</li>
            <li>✔ Attendance Tracking</li>
            <li>✔ Payroll & Leave Management</li>
          </ul>
          <button 
            className="btn btn-primary" 
            style={styles.buyBtn}
            disabled={processing}
            onClick={() => buyPlan("YEARLY")}
          >
            {processing ? "Processing..." : "Buy Yearly"}
          </button>
        </div>
      </div>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "1px solid var(--border-color)",
    padding: "8px 16px",
    color: "var(--text-primary)",
    cursor: "pointer",
  },
  card: {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: "30px",
    marginBottom: "40px",
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "20px",
  },
  label: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: "0 0 8px 0",
  },
  value: {
    fontSize: "18px",
    fontWeight: "600",
    margin: 0,
    color: "var(--text-primary)",
  },
  alert: {
    marginTop: "20px",
    padding: "16px",
    background: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    borderRadius: "12px",
    fontWeight: "600",
  },
  offer: {
    marginTop: "20px",
    padding: "16px",
    background: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
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
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "24px",
    padding: "40px",
    textAlign: "center",
    position: "relative",
    boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)",
  },
  popularBadge: {
    position: "absolute",
    top: "-12px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--primary)",
    color: "white",
    padding: "4px 16px",
    borderRadius: "99px",
    fontSize: "12px",
    fontWeight: "bold",
  },
  price: {
    fontSize: "40px",
    fontWeight: "800",
    color: "var(--text-primary)",
    margin: "20px 0",
  },
  period: {
    fontSize: "16px",
    color: "var(--text-secondary)",
    fontWeight: "500",
  },
  features: {
    listStyle: "none",
    padding: 0,
    margin: "0 0 30px 0",
    textAlign: "left",
    color: "var(--text-secondary)",
    lineHeight: "2",
  },
  buyBtn: {
    width: "100%",
    padding: "16px",
    fontSize: "16px",
  }
};