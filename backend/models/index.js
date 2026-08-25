const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Course = require('./Course');
const Student = require('./Student');

module.exports = {
  sequelize,
  Admin,
  Course,
  Student
};
