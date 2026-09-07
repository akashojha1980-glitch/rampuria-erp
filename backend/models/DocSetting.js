const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const DocSetting = sequelize.define('DocSetting', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  label: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isCustom: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = DocSetting;
