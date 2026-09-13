const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TenantSupportTicket = sequelize.define('TenantSupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  ticketNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  tenantId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  collegeCode: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  collegeName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPerson: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  contactPhone: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  issueType: {
    type: DataTypes.STRING,
    defaultValue: 'Technical Bug' // 'Technical Bug', 'Database Issue', 'License Issue', 'Feature Request', 'Training / Support', 'Other'
  },
  priority: {
    type: DataTypes.STRING,
    defaultValue: 'Medium' // 'Low', 'Medium', 'High', 'Critical'
  },
  assignedTo: {
    type: DataTypes.STRING,
    defaultValue: 'Support Team'
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Open' // 'Open', 'In Progress', 'Resolved', 'Closed'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  resolutionNotes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  resolvedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
});

module.exports = TenantSupportTicket;