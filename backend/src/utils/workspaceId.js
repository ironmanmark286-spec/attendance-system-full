const crypto = require("crypto");

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomSegment(length = 6) {
  const bytes = crypto.randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARSET[bytes[i] % CHARSET.length];
  }
  return result;
}

async function generateUniqueWorkspaceId(pool, maxAttempts = 10) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const workspaceId = `WS-${randomSegment(6)}`;
    const [existing] = await pool.query(
      "SELECT id FROM companies WHERE company_code = ? LIMIT 1",
      [workspaceId]
    );
    if (!existing.length) return workspaceId;
  }
  throw new Error("Failed to generate unique workspace ID");
}

module.exports = { generateUniqueWorkspaceId };
