const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const roleGuard = require("../middleware/roles");

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notices WHERE company_id = ? ORDER BY created_at DESC", [req.user.company_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    const { title, message, type } = req.body;
    await pool.query(
      "INSERT INTO notices (company_id, title, message, type) VALUES (?, ?, ?, ?)",
      [req.user.company_id, title, message, type]
    );
    res.status(201).json({ message: "Notice published" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, roleGuard("ADMIN", "HR"), async (req, res) => {
  try {
    await pool.query("DELETE FROM notices WHERE id = ? AND company_id = ?", [req.params.id, req.user.company_id]);
    res.json({ message: "Notice deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;