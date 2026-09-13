const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TenantLicense = sequelize.define('TenantLicense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  collegeCode: {
    type: DataTypes.STRING,
    allowNull: false
  },
  collegeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  licenseKey: {
    type: DataTypes.STRING,
    allowNull: false
  },
  actionType: {
    type: DataTypes.STRING,
    defaultValue: 'Renewal' // 'Initial', 'Renewal', 'Upgrade', 'Extension'
  },
  packageType: {
    type: DataTypes.STRING,
    defaultValue: 'Standard'
  },
  prevExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  newExpiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  invoiceNo: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  performedBy: {
    type: DataTypes.STRING,
    defaultValue: 'SuperAdmin'
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
});

module.exports = TenantLicense;