const pool = require("../db");

const subscriptionCheck = async (req, res, next) => {
  try {
    // Skip subscription check if user is not logged in or company ID is missing
    if (!req.user || !req.user.company_id) {
      return next();
    }

    // Owner / Superadmin should never be blocked by subscription
    if (req.user.role === "SUPERADMIN") {
      return next();
    }

    const compId = req.user.company_id;
    const [rows] = await pool.query(
      "SELECT subscription_status, trial_ends_at, subscription_ends_at FROM companies WHERE id = ?",
      [compId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Company not found" });
    }

    const company = rows[0];
    const now = new Date();

    if (company.subscription_status === "TRIAL") {
      if (company.trial_ends_at && new Date(company.trial_ends_at) < now) {
        // Trial expired
        await pool.query("UPDATE companies SET subscription_status = 'EXPIRED' WHERE id = ?", [compId]);
        return res.status(402).json({ 
          message: "Free trial has expired. Please subscribe to continue.",
          code: "SUBSCRIPTION_EXPIRED"
        });
      }
    } else if (company.subscription_status === "ACTIVE") {
      if (company.subscription_ends_at && new Date(company.subscription_ends_at) < now) {
        // Subscription expired
        await pool.query("UPDATE companies SET subscription_status = 'EXPIRED' WHERE id = ?", [compId]);
        return res.status(402).json({ 
          message: "Subscription has expired. Please renew to continue.",
          code: "SUBSCRIPTION_EXPIRED"
        });
      }
    } else if (company.subscription_status === "EXPIRED") {
        return res.status(402).json({ 
            message: "Subscription expired. Please subscribe to continue.",
            code: "SUBSCRIPTION_EXPIRED"
        });
    }

    next();
  } catch (error) {
    console.error("Subscription check error:", error);
    res.status(500).json({ message: "Internal server error during subscription check" });
  }
};

module.exports = subscriptionCheck;