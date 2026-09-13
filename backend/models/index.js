const { sequelize } = require('../config/db');
const Admin = require('./Admin');
const Course = require('./Course');
const Student = require('./Student');
const AppSetting = require('./AppSetting');
const FeePayment = require('./FeePayment');
const Expense = require('./Expense');
const Book = require('./Book');
const BookIssue = require('./BookIssue');
const Result = require('./Result');
const DocSetting = require('./DocSetting');
const AcademicSession = require('./AcademicSession');
const SuperAdmin = require('./SuperAdmin');
const TenantCollege = require('./TenantCollege');
const TenantLicense = require('./TenantLicense');
const TenantSupportTicket = require('./TenantSupportTicket');
const TenantPayment = require('./TenantPayment');
const AuditLog = require('./AuditLog');

module.exports = {
  sequelize,
  Admin,
  Course,
  Student,
  AppSetting,
  FeePayment,
  Expense,
  Book,
  BookIssue,
  Result,
  DocSetting,
  AcademicSession,
  SuperAdmin,
  TenantCollege,
  TenantLicense,
  TenantSupportTicket,
  TenantPayment,
  AuditLog
};

