require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

async function createOwner() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "attendance_db",
  });

  try {
    const ownerCompanyCode = "AK-OWNER";
    const ownerCompanyName = "Attendance Platform Owner";
    const ownerUsername = "superadmin";
    const ownerPasswordPlain = "Owner@2026"; // Easy to change if needed

    // 1. Create or Find Owner Company
    console.log("Setting up owner company...");
    let [compRows] = await connection.query("SELECT id FROM companies WHERE company_code = ?", [ownerCompanyCode]);
    let compId;

    if (compRows.length > 0) {
      compId = compRows[0].id;
      console.log("Owner company already exists.");
    } else {
      // Create company with lifetime active subscription just in case
      const [insertComp] = await connection.query(
        `INSERT INTO companies (company_code, name, subscription_plan, subscription_status, subscription_ends_at) 
         VALUES (?, ?, 'YEARLY', 'ACTIVE', '2037-12-31 00:00:00')`,
        [ownerCompanyCode, ownerCompanyName]
      );
      compId = insertComp.insertId;
      console.log("Owner company created.");
    }

    // 2. Create Superadmin User
    console.log("Setting up superadmin user...");
    let [userRows] = await connection.query("SELECT id FROM users WHERE username = ? AND company_id = ?", [ownerUsername, compId]);

    if (userRows.length > 0) {
      console.log("Superadmin user already exists. Updating password...");
      const hash = await bcrypt.hash(ownerPasswordPlain, 10);
      await connection.query("UPDATE users SET password_hash = ?, role = 'SUPERADMIN' WHERE id = ?", [hash, userRows[0].id]);
    } else {
      const hash = await bcrypt.hash(ownerPasswordPlain, 10);
      await connection.query(
        "INSERT INTO users (company_id, username, password_hash, role) VALUES (?, ?, ?, 'SUPERADMIN')",
        [compId, ownerUsername, hash]
      );
      console.log("Superadmin user created.");
    }

    console.log("\n=================================================");
    console.log("✅ OWNER CREDENTIALS GENERATED SUCCESSFULLY");
    console.log("=================================================");
    console.log("Workspace ID / Company Code : " + ownerCompanyCode);
    console.log("Username                    : " + ownerUsername);
    console.log("Password                    : " + ownerPasswordPlain);
    console.log("=================================================");
    console.log("You can log in with these details. You will NEVER be asked to pay.");

  } catch (err) {
    console.error("Failed to create owner:", err);
  } finally {
    await connection.end();
  }
}

createOwner();