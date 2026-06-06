const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { companyName, companyCode, username, password } = req.body;

    if (!companyName || !companyCode || !username || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existingComp] = await pool.query("SELECT id FROM companies WHERE company_code = ?", [companyCode]);
    if (existingComp.length) return res.status(400).json({ message: "Workspace ID (Company Code) already taken! Please choose a unique one." });

    // Set trial ends at 30 days from now
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);

    const [compResult] = await pool.query(
      "INSERT INTO companies (company_code, name, trial_ends_at) VALUES (?, ?, ?)", 
      [companyCode, companyName, trialEndsAt]
    );
    const compId = compResult.insertId;

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (company_id, username, password_hash, role) VALUES (?, ?, ?, 'ADMIN')",
      [compId, username, hash]
    );

    return res.status(201).json({ message: "Workspace registered successfully! You can now log in." });
  } catch (err) {
    return res.status(500).json({ message: "Registration failed due to server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { companyCode, username, password } = req.body;

    if (!companyCode || !username || !password) {
      return res.status(400).json({ message: "Company Code, Username, and Password are required" });
    }

    const [comps] = await pool.query("SELECT id FROM companies WHERE company_code = ?", [companyCode]);
    if (!comps.length) return res.status(401).json({ message: "Invalid Company Code" });
    const compId = comps[0].id;

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

      return res.json({ token, role: user.role });
    }

    [rows] = await pool.query(
      "SELECT id, emp_code, name, password_hash, status FROM employees WHERE emp_code = ? AND company_id = ?",
      [username, compId]
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const emp = rows[0];
    if (emp.status !== "ACTIVE") return res.status(403).json({ message: "Employee inactive" });

    const passOk = await bcrypt.compare(password, emp.password_hash);
    if (!passOk) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: emp.id, role: "EMPLOYEE", employee_id: emp.id, company_id: compId },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ token, role: "EMPLOYEE", name: emp.name, emp_code: emp.emp_code });
  } catch (err) {
    if (err && (err.code === "ER_ACCESS_DENIED_ERROR" || err.code === "ECONNREFUSED")) {
      return res.status(500).json({
        message:
          "Database connection failed. Update backend/.env DB settings and run backend/src/sql/init.sql."
      });
    }
    return res.status(500).json({ message: "Login failed due to server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { companyCode, username, newPassword } = req.body;

    if (!companyCode || !username || !newPassword) {
      return res.status(400).json({ message: "Company Code, Username, and New Password are required" });
    }

    const [comps] = await pool.query("SELECT id FROM companies WHERE company_code = ?", [companyCode]);
    if (!comps.length) return res.status(401).json({ message: "Invalid Company Code" });
    const compId = comps[0].id;

    // Check Admin first
    let [rows] = await pool.query("SELECT id FROM users WHERE username = ? AND company_id = ?", [username, compId]);
    
    if (rows.length) {
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, rows[0].id]);
      return res.json({ message: "Admin password reset successfully." });
    }

    // Check Employee
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
