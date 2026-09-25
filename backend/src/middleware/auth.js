const jwt = require('jsonwebtoken');
const env = require('../config/env');
const db = require('../config/database');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    
    // Fetch user from DB to guarantee validity and fresh role/federation
    const user = db.prepare(`
      SELECT id, name, email, phone, role, federation_id, preferred_language
      FROM users
      WHERE id = ?
    `).get(payload.id);

    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of [${roles.join(', ')}] role` });
    }
    next();
  };
}

module.exports = {
  authenticateToken,
  requireRole
};
