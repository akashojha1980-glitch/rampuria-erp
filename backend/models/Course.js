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
  },
  schemeType: {
    type: DataTypes.STRING,
    defaultValue: 'Semester'
  },
  academicYear: {
    type: DataTypes.STRING,
    defaultValue: '1st Year'
  },
  semester: {
    type: DataTypes.STRING,
    defaultValue: 'I & II Semester'
  },
  firstInstallment: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  firstInstallmentDesc: {
    type: DataTypes.STRING,
    defaultValue: 'at the time of Admission'
  },
  secondInstallment: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  secondInstallmentDesc: {
    type: DataTypes.STRING,
    defaultValue: 'at the time of Exam Form'
  },
  totalFee: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  cautionMoney: {
    type: DataTypes.FLOAT,
    defaultValue: 300.0
  },
  provisionalPromotionFee: {
    type: DataTypes.FLOAT,
    defaultValue: 300.0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = Course;
