require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

async function createOwner() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "attendance_db",
  });

  try {
    const ownerCompanyName = "Attendance Platform Owner";
    const ownerUsername = "superadmin";
    // Fixed password taaki type karne mein galti na ho
    const ownerPasswordPlain = "Super@Admin1"; 

    // 1. Create or Find Owner Company
    console.log("Setting up owner company...");
    let [compRows] = await connection.query("SELECT id, company_code FROM companies WHERE name = ?", [ownerCompanyName]);
    let compId;
    let workspaceId = "WS-ADMIN"; // Hamesha fixed rahega

    if (compRows.length > 0) {
      compId = compRows[0].id;
      // Agar pehle kuch aur tha, toh usko update karke WS-ADMIN kar do
      await connection.query("UPDATE companies SET company_code = ? WHERE id = ?", [workspaceId, compId]);
      console.log("Owner company updated to WS-ADMIN.");
    } else {
      // Create company with lifetime active subscription just in case
      const [insertComp] = await connection.query(
        `INSERT INTO companies (company_code, name, subscription_plan, subscription_status, subscription_ends_at) 
         VALUES (?, ?, 'YEARLY', 'ACTIVE', '2037-12-31 00:00:00')`,
        [workspaceId, ownerCompanyName]
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
    console.log("Workspace ID                : " + workspaceId);
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