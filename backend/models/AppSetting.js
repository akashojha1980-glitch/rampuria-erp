const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const AppSetting = sequelize.define('AppSetting', {
  key: {
    type: DataTypes.STRING(100),
    primaryKey: true,
    allowNull: false
  },
  value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  timestamps: true,
  tableName: 'app_settings'
});

module.exports = AppSetting;
