const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    set(value) {
      this.setDataValue('code', value.toUpperCase().trim());
    }
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalSeats: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cutoffMarks: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 50
  },
  reservations: {
    type: DataTypes.TEXT,
    defaultValue: '{"General":0,"OBC":0,"SC":0,"ST":0}',
    get() {
      const rawValue = this.getDataValue('reservations');
      return rawValue ? JSON.parse(rawValue) : { General: 0, OBC: 0, SC: 0, ST: 0 };
    },
    set(value) {
      this.setDataValue('reservations', JSON.stringify(value));
    }
  }
});

module.exports = Course;
