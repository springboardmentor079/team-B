const jwt = require('jsonwebtoken');

const getAdminJwtSecret = () => process.env.ADMIN_JWT_SECRET || `${process.env.JWT_SECRET}_admin`;

const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Admin token required' });
    }

    const decoded = jwt.verify(token, getAdminJwtSecret());
    if (!decoded || decoded.type !== 'admin') {
      return res.status(401).json({ message: 'Invalid admin token' });
    }

    req.admin = {
      username: decoded.username,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired admin token' });
  }
};

module.exports = {
  authenticateAdmin,
  getAdminJwtSecret,
};
