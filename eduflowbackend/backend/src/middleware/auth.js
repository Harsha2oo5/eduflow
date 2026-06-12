const jwt = require('jsonwebtoken');

// This middleware runs BEFORE your route handler
// It checks: is the user logged in? Is their token valid?
// Usage: router.get('/protected', authenticate, yourController)

const authenticate = (req, res, next) => {
  // Token comes in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1]; // extract the actual token

  try {
    // jwt.verify throws an error if token is invalid or expired
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to req so route handlers can use it
    // e.g. req.user.id, req.user.role
    req.user = decoded;
    next(); // move on to the actual route handler
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
};

// Role-based access control
// Usage: router.post('/teacher-only', authenticate, authorize('teacher'), handler)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This route is for: ${roles.join(', ')} only.`
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
