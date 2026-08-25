const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Student = require('./Student');

const FeePayment = sequelize.define('FeePayment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Students',
      key: 'id'
    }
  },
  academicYear: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: '1st Year'
  },
  semester: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Annual'
  },
  installmentName: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Full Payment'
  },
  amountPaid: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  amountDue: {
    type: DataTypes.FLOAT,
    allowNull: false,
    defaultValue: 0.0
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    defaultValue: null
  },
  receiptNo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  paymentDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  paymentMode: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Cash'
  },
  transactionNo: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: ''
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  }
});

// Setup relationships
Student.hasMany(FeePayment, { foreignKey: 'studentId', as: 'payments' });
FeePayment.belongsTo(Student, { foreignKey: 'studentId', as: 'student' });

module.exports = FeePayment;
