const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  voucherNo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Miscellaneous'
  },
  expenseDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  paidTo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  paymentMode: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Cash'
  },
  transactionRef: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  receiptFileUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  narration: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  academicSession: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '2025-26'
  },
  authorizedBy: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Accountant'
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'APPROVED'
  }
}, {
  indexes: [
    {
      fields: ['expenseDate']
    },
    {
      fields: ['category']
    },
    {
      fields: ['paymentMode']
    },
    {
      fields: ['academicSession']
    }
  ]
});

module.exports = Expense;
