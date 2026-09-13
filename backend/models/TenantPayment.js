const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TenantPayment = sequelize.define('TenantPayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
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
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  amcAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paymentMode: {
    type: DataTypes.STRING,
    defaultValue: 'NEFT / RTGS' // 'Cash', 'Cheque', 'NEFT / RTGS', 'UPI / Online'
  },
  transactionRef: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  renewalDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  paymentStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Completed' // 'Completed', 'Pending', 'Due'
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  recordedBy: {
    type: DataTypes.STRING,
    defaultValue: 'SuperAdmin'
  }
});

module.exports = TenantPayment;