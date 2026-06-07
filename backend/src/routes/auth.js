const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { generateUniqueWorkspaceId } = require("../utils/workspaceId");
const { DEFAULT_COMPANY_SETTINGS } = require("../config/companyDefaults");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { companyName, username, password, adminEmail } = req.body;

    if (!companyName || !username || !password) {
      return res.status(400).json({ message: "Company name, username, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    if (adminEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminEmail)) {
        return res.status(400).json({ message: "Please enter a valid admin email address" });
      }
      const [emailTaken] = await pool.query("SELECT id FROM companies WHERE admin_email = ?", [adminEmail]);
      if (emailTaken.length) {
        return res.status(400).json({ message: "This email is already registered with another workspace" });
      }
    }

    const workspaceId = await generateUniqueWorkspaceId(pool);

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const settings = JSON.stringify(DEFAULT_COMPANY_SETTINGS);

    const [compResult] = await pool.query(
      `INSERT INTO companies (company_code, name, admin_email, trial_ends_at, settings) 
       VALUES (?, ?, ?, ?, ?)`,
      [workspaceId, companyName, adminEmail || null, trialEndsAt, settings]
    );
    const compId = compResult.insertId;

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (company_id, username, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
      [compId, username, hash]
    );

    return res.status(201).json({
      message: "Workspace created successfully! Save your Workspace ID — you'll need it to login.",
      workspaceId,
      companyName,
      adminEmail: adminEmail || null,
    });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Registration failed: " + (err.sqlMessage || err.message || "Server error") });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { companyCode, username, password } = req.body;

    if (!companyCode || !username || !password) {
      return res.status(400).json({ message: "Workspace ID, Username, and Password are required" });
    }

    const normalizedCode = companyCode.trim().toUpperCase();

    const [comps] = await pool.query(
      "SELECT id, name, trial_ends_at, subscription_ends_at, subscription_status, subscription_plan FROM companies WHERE company_code = ?",
      [normalizedCode]
    );
    if (!comps.length) return res.status(401).json({ message: "Invalid Workspace ID" });
    const compId = comps[0].id;
    const comp = comps[0];

    const now = new Date();
    let isExpired = comp.subscription_status === "EXPIRED";
    if (comp.subscription_status === "TRIAL" && comp.trial_ends_at && new Date(comp.trial_ends_at) < now) {
      isExpired = true;
    } else if (comp.subscription_status === "ACTIVE" && comp.subscription_ends_at && new Date(comp.subscription_ends_at) < now) {
      isExpired = true;
    }

    if (isExpired && comp.subscription_status !== "EXPIRED") {
      await pool.query("UPDATE companies SET subscription_status = 'EXPIRED' WHERE id = ?", [compId]);
    }

    let [rows] = await pool.query("SELECT * FROM users WHERE username = ? AND company_id = ?", [username, compId]);

    if (rows.length) {
      const user = rows[0];
      const ok = await bcrypt.compare(password, user.password_hash);
      if (!ok) return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: user.id, role: user.role, employee_id: user.employee_id || null, company_id: compId },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      return res.json({
        token,
        role: user.role,
        workspaceId: normalizedCode,
        companyName: comp.name,
        subscriptionExpired: isExpired && user.role !== "SUPERADMIN",
      });
    }

    [rows] = await pool.query(
      "SELECT id, emp_code, name, password_hash, status FROM employees WHERE emp_code = ? AND company_id = ?",
      [username, compId]
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const emp = rows[0];
    if (emp.status !== "ACTIVE") return res.status(403).json({ message: "Employee inactive" });
    if (isExpired) return res.status(403).json({ message: "Workspace subscription has expired. Please contact your admin." });

    const passOk = await bcrypt.compare(password, emp.password_hash);
    if (!passOk) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: emp.id, role: "EMPLOYEE", employee_id: emp.id, company_id: compId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      role: "EMPLOYEE",
      name: emp.name,
      emp_code: emp.emp_code,
      workspaceId: normalizedCode,
      companyName: comp.name,
    });
  } catch (err) {
    if (err && (err.code === "ER_ACCESS_DENIED_ERROR" || err.code === "ECONNREFUSED")) {
      return res.status(500).json({
        message:
          "Database connection failed. Update backend/.env DB settings and run backend/src/sql/init.sql.",
      });
    }
    return res.status(500).json({ message: "Login failed due to server error" });
  }
});

router.get("/workspace", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      `SELECT company_code, name, admin_email, subscription_plan, subscription_status, 
              trial_ends_at, subscription_ends_at, settings, created_at 
       FROM companies WHERE id = ?`,
      [decoded.company_id]
    );

    if (!rows.length) return res.status(404).json({ message: "Workspace not found" });

    const company = rows[0];
    let settings = DEFAULT_COMPANY_SETTINGS;
    try {
      settings = typeof company.settings === "string"
        ? JSON.parse(company.settings)
        : (company.settings || DEFAULT_COMPANY_SETTINGS);
    } catch {
      settings = DEFAULT_COMPANY_SETTINGS;
    }

    res.json({
      workspaceId: company.company_code,
      companyName: company.name,
      adminEmail: company.admin_email,
      subscriptionPlan: company.subscription_plan,
      subscriptionStatus: company.subscription_status,
      trialEndsAt: company.trial_ends_at,
      subscriptionEndsAt: company.subscription_ends_at,
      createdAt: company.created_at,
      features: settings,
    });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { companyCode, username, newPassword } = req.body;

    if (!companyCode || !username || !newPassword) {
      return res.status(400).json({ message: "Workspace ID, Username, and New Password are required" });
    }

    const normalizedCode = companyCode.trim().toUpperCase();

    const [comps] = await pool.query("SELECT id FROM companies WHERE company_code = ?", [normalizedCode]);
    if (!comps.length) return res.status(401).json({ message: "Invalid Workspace ID" });
    const compId = comps[0].id;

    let [rows] = await pool.query("SELECT id FROM users WHERE username = ? AND company_id = ?", [username, compId]);

    if (rows.length) {
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, rows[0].id]);
      return res.json({ message: "Admin password reset successfully." });
    }

    [rows] = await pool.query("SELECT id FROM employees WHERE emp_code = ? AND company_id = ?", [username, compId]);
    if (!rows.length) return res.status(401).json({ message: "User not found" });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE employees SET password_hash = ? WHERE id = ?", [hash, rows[0].id]);

    return res.json({ message: "Employee password reset successfully." });
  } catch (err) {
    return res.status(500).json({ message: "Password reset failed due to server error" });
  }
});

module.exports = router;
