require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const employeesRoutes = require("./routes/employees");
const leavesRoutes = require("./routes/leaves");
const payslipRoutes = require("./routes/payslips");
const noticesRoutes = require("./routes/notices");
const otSettingsRoutes = require("./routes/ot-settings");
const aiRoutes = require("./routes/ai");
const billingRoutes = require("./routes/billing");
const auth = require("./middleware/auth");

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/", (req, res) => res.send("Attendance API running"));
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/employees", employeesRoutes);
app.use("/api/leaves", leavesRoutes);
app.use("/api/payslips", payslipRoutes);
app.use("/api/notices", noticesRoutes);
app.use("/api/ot-settings", otSettingsRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/billing", auth, billingRoutes);

// --- Serve Frontend on Render ---
// Serve the web-admin build folder if it exists (for Render monolithic deployment)
app.use(express.static(path.join(__dirname, "../../web-admin/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../web-admin/build", "index.html"));
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
