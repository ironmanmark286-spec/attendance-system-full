const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

// Setup Multer for file uploads (Receipts/Bills)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../../uploads/expenses");
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'expense-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// 1. Employee applies for reimbursement
router.post("/", auth, roleGuard("EMPLOYEE"), upload.single("file"), async (req, res) => {
  try {
    const { title, amount, category, description } = req.body;
    let filePath = null;
    if (req.file) { filePath = "/uploads/expenses/" + req.file.filename; }
    
    await pool.query(
      "INSERT INTO expenses (company_id, employee_id, title, amount, category, description, file_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')",
      [req.user.company_id, req.user.employee_id, title, amount, category || 'General', description, filePath]
    );
    res.status(201).json({ message: "Expense claimed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Employee gets their own expenses
router.get("/me", auth, roleGuard("EMPLOYEE"), async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM expenses WHERE employee_id = ? AND company_id = ? ORDER BY created_at DESC", [req.user.employee_id, req.user.company_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// 3. Admin gets all expenses for the company
router.get("/", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT x.*, e.name as employee_name, e.emp_code
      FROM expenses x JOIN employees e ON x.employee_id = e.id
      WHERE x.company_id = ? ORDER BY x.created_at DESC
    `, [req.user.company_id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// 4. Admin updates expense status (Approve/Reject)
router.put("/:id/status", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    const { status } = req.body;
    await pool.query("UPDATE expenses SET status = ? WHERE id = ? AND company_id = ?", [status, req.params.id, req.user.company_id]);
    res.json({ message: `Expense marked as ${status}` });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

module.exports = router;