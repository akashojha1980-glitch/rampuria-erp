const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Course = require('./Course');
const Student = require('./Student');
const AppSetting = require('./AppSetting');
const FeePayment = require('./FeePayment');
const Expense = require('./Expense');

module.exports = {
  sequelize,
  Admin,
  Course,
  Student,
  AppSetting,
  FeePayment,
  Expense
};
