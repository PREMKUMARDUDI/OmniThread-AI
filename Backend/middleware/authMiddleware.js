import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.header("Authorization");

  if (!token)
    return res.status(401).json({ message: "No token, authorization denied" });

  try {
    // Remove "Bearer " prefix if present, or just verify the token string
    const actualToken = token.startsWith("Bearer ")
      ? token.slice(7, token.length)
      : token;
    const decoded = jwt.verify(actualToken, process.env.JWT_SECRET);

    req.user = decoded; // Attach user payload (id) to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Token is not valid" });
  }
};
