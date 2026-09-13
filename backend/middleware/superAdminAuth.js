const jwt = require('jsonwebtoken');
const SuperAdmin = require('../models/SuperAdmin');
const AuditLog = require('../models/AuditLog');

const protectSuperAdmin = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_admin_master_secret_key_2026');

      if (!decoded.isSuperAdmin) {
        return res.status(403).json({ message: 'Access denied: Super Admin authorization required.' });
      }

      req.superAdmin = await SuperAdmin.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'securityAnswer'] }
      });

      if (!req.superAdmin || !req.superAdmin.isActive) {
        return res.status(401).json({ message: 'Super Admin account not found or suspended.' });
      }

      next();
    } catch (error) {
      console.error('[SuperAdmin Auth Error]:', error.message);
      return res.status(401).json({ message: 'Not authorized, invalid Super Admin token.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, Super Admin token missing.' });
  }
};

// Helper to log audit actions easily from any controller
const logAudit = async (req, action, moduleName, target = '', details = '') => {
  try {
    const userName = req.superAdmin ? req.superAdmin.name || req.superAdmin.username : 'System';
    const userRole = req.superAdmin ? req.superAdmin.role : 'SuperAdmin';
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    await AuditLog.create({
      userName,
      userRole,
      action,
      module: moduleName,
      target,
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
      ipAddress
    });
  } catch (err) {
    console.error('[Audit Log Error]:', err.message);
  }
};

module.exports = { protectSuperAdmin, logAudit };