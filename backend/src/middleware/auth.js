const jwt = require("jsonwebtoken");
const subscriptionCheck = require("./subscriptionCheck");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    
    // Skip subscription check for billing routes to allow payment when expired
    if (req.originalUrl && req.originalUrl.includes("/api/billing")) {
      return next();
    }
    
    // Run subscription check after setting req.user
    subscriptionCheck(req, res, next);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
