const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const mapId = (instance) => {
  if (!instance) return null;
  return typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
};

// @desc    Get Detailed Fees Collection Reports (Aggregates & Logs)
// @route   GET /api/reports/fees
// @access  Private
router.get('/fees', protect, async (req, res) => {
  const { startDate, endDate, course, paymentMode } = req.query;

  try {
    const where = {};
    if (startDate && endDate) {
      where.paymentDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.paymentDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.paymentDate = { [Op.lte]: endDate };
    }
    
    if (paymentMode) {
      where.paymentMode = paymentMode;
    }
    
    const studentWhere = {};
    if (course) {
      studentWhere.courseApplied = course;
    }

    // 1. Fetch detailed transaction log matching query
    const transactions = await FeePayment.findAll({
      where,
      include: [{
        model: Student,
        as: 'student',
        attributes: ['fullName', 'registrationId', 'courseApplied', 'mobileNumber'],
        where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined
      }],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']]
    });

    // 2. Fetch Aggregated Reports
    if (course) {
      const students = await Student.findAll({
        where: { courseApplied: course },
        attributes: ['id']
      });
      const studentIds = students.map(s => s.id);
      where.studentId = { [Op.in]: studentIds };
    }

    // Daily sums
    const daily = await FeePayment.findAll({
      where,
      attributes: [
        'paymentDate',
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount']
      ],
      group: ['paymentDate'],
      order: [['paymentDate', 'DESC']],
      limit: 100
    });

    const isSqlite = sequelize.getDialect() === 'sqlite';
    const yearFn = isSqlite ? "strftime('%Y', paymentDate)" : "YEAR(paymentDate)";
    const monthFn = isSqlite ? "strftime('%m', paymentDate)" : "MONTH(paymentDate)";

    // Monthly sums
    const monthly = await FeePayment.findAll({
      where,
      attributes: [
        [sequelize.literal(yearFn), 'year'],
        [sequelize.literal(monthFn), 'month'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount']
      ],
      group: [sequelize.literal(yearFn), sequelize.literal(monthFn)],
      order: [
        [sequelize.literal(yearFn), 'DESC'],
        [sequelize.literal(monthFn), 'DESC']
      ]
    });

    // Yearly sums
    const yearly = await FeePayment.findAll({
      where,
      attributes: [
        [sequelize.literal(yearFn), 'year'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount']
      ],
      group: [sequelize.literal(yearFn)],
      order: [[sequelize.literal(yearFn), 'DESC']]
    });

    res.json({
      daily,
      monthly,
      yearly,
      logs: transactions.map(t => {
        const obj = mapId(t);
        obj._id = obj.id;
        if (obj.student) obj.student._id = obj.student.id;
        return obj;
      })
    });
  } catch (err) {
    console.error('[Reports Fees API] error:', err.message);
    res.status(500).json({ message: 'Server error generating fees collection report' });
  }
});

// @desc    Get New Admission Reports (Aggregates & Logs)
// @route   GET /api/reports/admissions
// @access  Private
router.get('/admissions', protect, async (req, res) => {
  const { startDate, endDate, course, status, category } = req.query;

  try {
    const where = {};
    
    // Date filter on student creation
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999Z')] };
    } else if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { [Op.lte]: new Date(endDate + 'T23:59:59.999Z') };
    }

    if (course) {
      where.courseApplied = course;
    }

    if (status) {
      where.verificationStatus = status;
    }

    if (category) {
      where.category = category;
    }

    // 1. Fetch detailed new admission student list
    const students = await Student.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'registrationId', 'fullName', 'courseApplied', 'gender', 
        'category', 'mobileNumber', 'email', 'verificationStatus', 'createdAt'
      ]
    });

    // 2. Fetch aggregates grouped by Date
    const isSqlite = sequelize.getDialect() === 'sqlite';
    const dateFn = isSqlite ? "date(createdAt)" : "CONVERT(DATE, createdAt)";
    const yearFn = isSqlite ? "strftime('%Y', createdAt)" : "YEAR(createdAt)";
    const monthFn = isSqlite ? "strftime('%m', createdAt)" : "MONTH(createdAt)";

    const daily = await Student.findAll({
      where,
      attributes: [
        [sequelize.literal(dateFn), 'date'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.literal(dateFn)],
      order: [[sequelize.literal(dateFn), 'DESC']],
      limit: 100
    });

    // Aggregates grouped by Month
    const monthly = await Student.findAll({
      where,
      attributes: [
        [sequelize.literal(yearFn), 'year'],
        [sequelize.literal(monthFn), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.literal(yearFn), sequelize.literal(monthFn)],
      order: [
        [sequelize.literal(yearFn), 'DESC'],
        [sequelize.literal(monthFn), 'DESC']
      ]
    });

    // Aggregates grouped by Course
    const courseStats = await Student.findAll({
      where,
      attributes: [
        'courseApplied',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['courseApplied'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']]
    });

    res.json({
      daily: daily.map(d => ({
        date: d.get('date'),
        count: d.get('count')
      })),
      monthly: monthly.map(m => ({
        year: m.get('year'),
        month: m.get('month'),
        count: m.get('count')
      })),
      courseStats,
      logs: students.map(s => {
        const obj = mapId(s);
        obj._id = obj.id;
        return obj;
      })
    });
  } catch (err) {
    console.error('[Reports Admissions API] error:', err.message);
    res.status(500).json({ message: 'Server error generating new admissions report' });
  }
});

module.exports = router;
