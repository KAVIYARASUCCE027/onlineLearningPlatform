const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Access Denied: No Token Provided" });
  }

  const token = authHeader.split(" ")[1]; // Bearer <token>
  if (!token) {
    return res.status(401).json({ message: "Access Denied: Token Missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "Secret_Key");
    req.user = decoded;
    next(); // Continue to the next middleware/route handler
  } catch (err) {
    return res.status(403).json({ message: "Invalid Token" });
  }
};
