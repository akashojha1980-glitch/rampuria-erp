const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  userRole: {
    type: DataTypes.STRING,
    defaultValue: 'SuperAdmin'
  },
  action: {
    type: DataTypes.STRING,
    allowNull: false
  },
  module: {
    type: DataTypes.STRING,
    defaultValue: 'General'
  },
  target: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  details: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  ipAddress: {
    type: DataTypes.STRING,
    defaultValue: '127.0.0.1'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = AuditLog;