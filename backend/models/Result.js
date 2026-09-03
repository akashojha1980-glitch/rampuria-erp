const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Result = sequelize.define('Result', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  registrationId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  rollNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  studentName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fatherName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  course: {
    type: DataTypes.STRING,
    allowNull: false
  },
  academicSession: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '2025-26'
  },
  year: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1st Year'
  },
  semester: {
    type: DataTypes.STRING,
    defaultValue: 'Annual'
  },
  examType: {
    type: DataTypes.STRING,
    defaultValue: 'Main Annual Exam'
  },
  examMonthYear: {
    type: DataTypes.STRING,
    defaultValue: 'May 2026'
  },
  subjects: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const raw = this.getDataValue('subjects');
      try {
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    set(val) {
      this.setDataValue('subjects', typeof val === 'string' ? val : JSON.stringify(val || []));
    }
  },
  totalMaxMarks: {
    type: DataTypes.FLOAT,
    defaultValue: 500
  },
  totalObtainedMarks: {
    type: DataTypes.FLOAT,
    defaultValue: 0
  },
  percentage: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0
  },
  resultStatus: {
    type: DataTypes.STRING,
    defaultValue: 'Pass'
  },
  division: {
    type: DataTypes.STRING,
    defaultValue: 'First Division'
  },
  remarks: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  declaredDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
});

module.exports = Result;
