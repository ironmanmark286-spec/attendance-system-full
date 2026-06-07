const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const pool = require("../db");
const PLANS = require("../config/plans");
const roles = require("../middleware/roles");

const router = express.Router();

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}

router.post("/create-order", roles("ADMIN", "HR", "SUPERVISOR"), async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];

    if (!planConfig) {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ message: "Payment gateway not configured. Contact support." });
    }

    const options = {
      amount: planConfig.amount,
      currency: "INR",
      receipt: `receipt_${req.user.company_id}_${Date.now()}`,
      notes: {
        plan,
        company_id: String(req.user.company_id),
      },
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ message: "Failed to create order" });
    }

    await pool.query(
      `INSERT INTO billing_orders (company_id, razorpay_order_id, plan, amount, status)
       VALUES (?, ?, ?, ?, 'PENDING')`,
      [req.user.company_id, order.id, plan, planConfig.amount]
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan,
      rzpKey: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Internal server error during order creation" });
  }
});

router.post("/verify-payment", roles("ADMIN", "HR", "SUPERVISOR"), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing required payment fields" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Payment gateway not configured" });
    }

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: "Payment verification failed. Invalid signature." });
    }

    const compId = req.user.company_id;

    const [already] = await pool.query(
      "SELECT id FROM processed_payments WHERE company_id = ? AND razorpay_payment_id = ? LIMIT 1",
      [compId, razorpay_payment_id]
    );
    if (already.length) {
      return res.json({ message: "Payment already processed", bonusMonthAdded: false });
    }

    const [orderRows] = await pool.query(
      "SELECT plan, amount, status FROM billing_orders WHERE razorpay_order_id = ? AND company_id = ? LIMIT 1",
      [razorpay_order_id, compId]
    );

    if (!orderRows.length) {
      return res.status(400).json({ message: "Order not found. Please create a new order." });
    }

    const orderRecord = orderRows[0];
    if (orderRecord.status === "COMPLETED") {
      return res.json({ message: "Payment already processed", bonusMonthAdded: false });
    }

    const plan = orderRecord.plan;
    const planConfig = PLANS[plan];
    if (!planConfig || orderRecord.amount !== planConfig.amount) {
      return res.status(400).json({ message: "Order amount mismatch. Contact support." });
    }

    const [rows] = await pool.query("SELECT first_purchase_done, subscription_ends_at FROM companies WHERE id = ?", [compId]);
    const firstPurchase = rows[0]?.first_purchase_done === 0;

    const now = new Date();
    let subscriptionEndsAt = new Date(now);

    if (rows[0]?.subscription_ends_at && new Date(rows[0].subscription_ends_at) > now) {
      subscriptionEndsAt = new Date(rows[0].subscription_ends_at);
    }

    let monthsToAdd = planConfig.months;
    if (firstPurchase) {
      monthsToAdd += 1;
    }

    subscriptionEndsAt.setMonth(subscriptionEndsAt.getMonth() + monthsToAdd);

    await pool.query(
      `UPDATE companies 
       SET subscription_plan = ?, 
           subscription_status = 'ACTIVE', 
           subscription_ends_at = ?,
           first_purchase_done = 1
       WHERE id = ?`,
      [plan, subscriptionEndsAt, compId]
    );

    await pool.query(
      "UPDATE billing_orders SET status = 'COMPLETED' WHERE razorpay_order_id = ? AND company_id = ?",
      [razorpay_order_id, compId]
    );

    await pool.query(
      "INSERT INTO processed_payments (company_id, razorpay_payment_id, razorpay_order_id, plan) VALUES (?, ?, ?, ?)",
      [compId, razorpay_payment_id, razorpay_order_id, plan]
    );

    res.json({
      message: firstPurchase
        ? "Payment successful! Subscription activated with 1 bonus month free!"
        : "Payment successful! Subscription activated!",
      plan,
      endsAt: subscriptionEndsAt,
      bonusMonthAdded: firstPurchase,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Internal server error during verification" });
  }
});

router.get("/status", async (req, res) => {
  try {
    const compId = req.user.company_id;
    const [rows] = await pool.query(
      "SELECT subscription_plan, subscription_status, trial_ends_at, subscription_ends_at, first_purchase_done FROM companies WHERE id = ?",
      [compId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Company not found" });
    }

    const status = rows[0];
    const now = new Date();

    if (status.subscription_status === "TRIAL" && status.trial_ends_at) {
      const daysLeft = Math.max(0, Math.ceil((new Date(status.trial_ends_at) - now) / (1000 * 60 * 60 * 24)));
      status.trial_days_left = daysLeft;
    }

    if (status.subscription_status === "ACTIVE" && status.subscription_ends_at) {
      const daysLeft = Math.max(0, Math.ceil((new Date(status.subscription_ends_at) - now) / (1000 * 60 * 60 * 24)));
      status.subscription_days_left = daysLeft;
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
});

module.exports = router;
