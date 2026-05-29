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

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploads folder statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => res.send("Attendance API running"));
app.use("/auth", authRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/employees", employeesRoutes);
app.use("/leaves", leavesRoutes);
app.use("/payslips", payslipRoutes);
app.use("/notices", noticesRoutes);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
