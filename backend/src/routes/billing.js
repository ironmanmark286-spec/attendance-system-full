const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const pool = require("../db");

const router = express.Router();

// Razorpay is initialized lazily because env vars may be missing at server startup
function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) return null;
  return new Razorpay({ key_id, key_secret });
}


router.post("/create-order", async (req, res) => {
  try {
    const { plan } = req.body;
    
    let amount = 0;
    if (plan === "MONTHLY") {
      amount = 499 * 100; // Razorpay expects amount in paise
    } else if (plan === "YEARLY") {
      amount = 1999 * 100;
    } else {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${req.user.company_id}_${Date.now()}`
    };

    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(500).json({ message: "Razorpay keys not configured" });
    }

    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ message: "Failed to create order" });
    }


    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      // Frontend needs Razorpay Key ID (public key). Never expose secret.
      rzpKey: process.env.RAZORPAY_KEY_ID || null
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Internal server error during order creation" });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
      return res.status(400).json({ message: "Missing required payment fields" });
    }


    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Razorpay secret not configured" });
    }

    // Verify signature
    const shasum = crypto.createHmac("sha256", secret);

    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      return res.status(400).json({ message: "Transaction not legit!" });
    }

    // Payment is successful, update subscription
    const compId = req.user.company_id;

    // Idempotency: prevent multiple extensions for the same Razorpay payment
    // Requires a table: processed_payments( id, company_id, razorpay_payment_id, created_at )
    const [already] = await pool.query(
      "SELECT id FROM processed_payments WHERE company_id = ? AND razorpay_payment_id = ? LIMIT 1",
      [compId, razorpay_payment_id]
    );
    if (already.length) {
      return res.json({
        message: "Payment already processed",
        plan,
        endsAt: null,
        bonusMonthAdded: false
      });
    }

    const [rows] = await pool.query("SELECT first_purchase_done FROM companies WHERE id = ?", [compId]);
    const firstPurchase = rows[0]?.first_purchase_done === 0;


    const now = new Date();
    const subscriptionEndsAt = new Date(now);

    let monthsToAdd = plan === "YEARLY" ? 12 : 1;

    // Add 1 free month if it's their very first purchase
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


    res.json({
      message: "Payment successful and subscription updated!",
      plan,
      endsAt: subscriptionEndsAt,
      bonusMonthAdded: firstPurchase
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
        
        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch subscription status" });
    }
});

module.exports = router;