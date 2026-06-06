const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const pool = require("../db");

const router = express.Router();

// Initialize Razorpay
// Note: Fallback to test keys if environment variables are missing during dev
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "YourTestSecretHere",
});

router.post("/create-order", async (req, res) => {
  try {
    const { plan } = req.body;
    
    let amount = 0;
    if (plan === "MONTHLY") {
      amount = 499 * 100; // Razorpay expects amount in paise
    } else if (plan === "YEARLY") {
      amount = 4999 * 100;
    } else {
      return res.status(400).json({ message: "Invalid plan selected" });
    }

    const options = {
      amount,
      currency: "INR",
      receipt: `receipt_${req.user.company_id}_${Date.now()}`
    };

    let order;
    if (process.env.RAZORPAY_KEY_ID === undefined || process.env.RAZORPAY_KEY_ID === "rzp_test_YourTestKeyHere" || !process.env.RAZORPAY_KEY_ID) {
      // Mock order for testing when real keys are not set
      order = {
        id: `order_mock_${Date.now()}`,
        amount: options.amount,
        currency: options.currency
      };
    } else {
      order = await razorpay.orders.create(options);
    }
    
    if (!order) {
      return res.status(500).json({ message: "Failed to create order" });
    }

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      rzpKey: process.env.RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere"
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

    const secret = process.env.RAZORPAY_KEY_SECRET || "YourTestSecretHere";

    // Verify signature
    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest !== razorpay_signature) {
      // Allow mock signature during testing if keys aren't configured
      const isDummyKey = process.env.RAZORPAY_KEY_ID === undefined || process.env.RAZORPAY_KEY_ID === "rzp_test_YourTestKeyHere" || !process.env.RAZORPAY_KEY_ID;
      if (!(isDummyKey && razorpay_signature === "mock_signature")) {
        return res.status(400).json({ message: "Transaction not legit!" });
      }
    }

    // Payment is successful, update subscription
    const compId = req.user.company_id;
    
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
           first_purchase_done = TRUE
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