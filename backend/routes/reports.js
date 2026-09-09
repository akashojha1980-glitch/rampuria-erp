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

// @desc    Get Detailed Fees Posting List / Collection Register
// @route   GET /api/reports/fees-posting
// @access  Private
router.get('/fees-posting', protect, async (req, res) => {
  const { startDate, endDate, session, course, paymentMode, feeHead, search } = req.query;

  try {
    const where = {};
    if (startDate && endDate) {
      where.paymentDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.paymentDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.paymentDate = { [Op.lte]: endDate };
    }

    if (paymentMode && paymentMode !== 'All') {
      where.paymentMode = paymentMode;
    }

    if (feeHead && feeHead !== 'All') {
      where.installmentName = feeHead;
    }

    const studentWhere = {};
    if (session && session !== 'All') {
      studentWhere.academicSession = session;
    }
    if (course && course !== 'All') {
      studentWhere.courseApplied = course;
    }
    if (search) {
      studentWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { registrationId: { [Op.like]: `%${search}%` } },
        { mobileNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const transactions = await FeePayment.findAll({
      where,
      include: [{
        model: Student,
        as: 'student',
        attributes: [
          'id', 'fullName', 'registrationId', 'courseApplied', 
          'academicSession', 'currentYear', 'currentSemester', 'mobileNumber', 'fatherName'
        ],
        where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined
      }],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']]
    });

    let totalAmount = 0;
    const modeBreakdown = { Cash: 0, UPI: 0, Bank: 0, Cheque: 0, Online: 0, Other: 0 };
    const headBreakdown = {};

    const records = transactions.map(t => {
      const obj = mapId(t);
      obj._id = obj.id;
      if (obj.student) {
        obj.student._id = obj.student.id;
        obj.student.academicYear = obj.student.currentYear;
        obj.student.semester = obj.student.currentSemester;
      }
      obj.feeHead = obj.installmentName || 'General / Tuition';

      const amt = Number(obj.amountPaid) || 0;
      totalAmount += amt;

      const modeKey = (obj.paymentMode || 'Other');
      if (modeBreakdown[modeKey] !== undefined) {
        modeBreakdown[modeKey] += amt;
      } else {
        modeBreakdown.Other += amt;
      }

      const headKey = obj.feeHead;
      headBreakdown[headKey] = (headBreakdown[headKey] || 0) + amt;

      return obj;
    });

    res.json({
      totalAmount,
      totalTransactions: records.length,
      modeBreakdown,
      headBreakdown,
      records
    });
  } catch (err) {
    console.error('[Reports Fees-Posting API] error:', err.message);
    res.status(500).json({ message: 'Server error generating fees posting list' });
  }
});

// @desc    Get Day Book (Daily Cash / Inflow Accounting Register)
// @route   GET /api/reports/day-book
// @access  Private
router.get('/day-book', protect, async (req, res) => {
  const { date, endDate, session, paymentMode } = req.query;

  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const where = {};

    if (endDate && endDate !== targetDate) {
      where.paymentDate = { [Op.between]: [targetDate, endDate] };
    } else {
      where.paymentDate = targetDate;
    }

    if (paymentMode && paymentMode !== 'All') {
      where.paymentMode = paymentMode;
    }

    const studentWhere = {};
    if (session && session !== 'All') {
      studentWhere.academicSession = session;
    }

    const transactions = await FeePayment.findAll({
      where,
      include: [{
        model: Student,
        as: 'student',
        attributes: [
          'id', 'fullName', 'registrationId', 'courseApplied', 
          'academicSession', 'currentYear', 'currentSemester', 'mobileNumber'
        ],
        where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined
      }],
      order: [['createdAt', 'ASC'], ['id', 'ASC']]
    });

    let totalAmount = 0;
    let cashTotal = 0;
    let upiTotal = 0;
    let bankTotal = 0;
    let chequeTotal = 0;

    const vouchers = transactions.map((t, index) => {
      const obj = mapId(t);
      obj._id = obj.id;
      if (obj.student) {
        obj.student._id = obj.student.id;
        obj.student.academicYear = obj.student.currentYear;
        obj.student.semester = obj.student.currentSemester;
      }
      obj.voucherNo = `VR-${String(index + 1).padStart(4, '0')}`;
      obj.feeHead = obj.installmentName || 'Tuition Fee';

      const amt = Number(obj.amountPaid) || 0;
      totalAmount += amt;

      const pMode = (obj.paymentMode || '').toLowerCase();
      if (pMode === 'cash') cashTotal += amt;
      else if (pMode === 'upi' || pMode === 'online') upiTotal += amt;
      else if (pMode === 'bank transfer' || pMode === 'bank' || pMode === 'neft' || pMode === 'rtgs') bankTotal += amt;
      else if (pMode === 'cheque' || pMode === 'dd') chequeTotal += amt;
      else upiTotal += amt;

      return obj;
    });

    res.json({
      reportDate: targetDate,
      endDate: endDate || targetDate,
      totalAmount,
      cashTotal,
      upiTotal,
      bankTotal,
      chequeTotal,
      voucherCount: vouchers.length,
      vouchers
    });
  } catch (err) {
    console.error('[Reports Day-Book API] error:', err.message);
    res.status(500).json({ message: 'Server error generating day book' });
  }
});

module.exports = router;
