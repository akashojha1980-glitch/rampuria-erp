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

// @desc    Get Centralized Fees Dashboard Stats & Transactions
// @route   GET /api/fees/dashboard
// @access  Private (Terminal Admin desk)
router.get('/dashboard', protect, async (req, res) => {
  const { search, course, installment, page = 1, limit = 50 } = req.query;
  
  try {
    // 1. Calculate overall college-wide metrics
    const totalCollected = await FeePayment.sum('amountPaid') || 0;
    const totalOutstanding = await FeePayment.sum('amountDue') || 0;
    const totalTransactions = await FeePayment.count();
    
    // Count distinct students who have paid fees
    const [uniquePaidStudents] = await sequelizeQueryUniquePaidCount();

    // 2. Build filter conditions
    const where = {};
    const studentWhere = {};

    if (course) {
      studentWhere.courseApplied = course;
    }
    
    if (installment) {
      where.installmentName = installment;
    }

    if (search) {
      where[Op.or] = [
        { receiptNo: { [Op.like]: `%${search}%` } },
        { '$student.fullName$': { [Op.like]: `%${search}%` } },
        { '$student.registrationId$': { [Op.like]: `%${search}%` } }
      ];
    }

    // 3. Query filtered transaction history
    const { count, rows: transactions } = await FeePayment.findAndCountAll({
      where,
      include: [{
        model: Student,
        as: 'student',
        attributes: ['fullName', 'registrationId', 'courseApplied', 'srNo', 'formNo'],
        where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined
      }],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    });

    res.json({
      stats: {
        totalCollected,
        totalOutstanding,
        totalTransactions,
        uniquePaidStudents
      },
      transactions: transactions.map(t => {
        const obj = mapId(t);
        obj._id = obj.id;
        if (obj.student) {
          obj.student._id = obj.student.id;
        }
        return obj;
      }),
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      total: count
    });
  } catch (error) {
    console.error('[Fees Dashboard] Get error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error loading fees console details' });
  }
});

// Helper: Query distinct student count having paid fees
async function sequelizeQueryUniquePaidCount() {
  try {
    const result = await FeePayment.count({
      distinct: true,
      col: 'studentId'
    });
    return [result];
  } catch (e) {
    return [0];
  }
}

// @desc    Get Daily, Monthly, and Yearly Fees Collection Reports
// @route   GET /api/fees/reports
// @access  Private (Terminal Admin desk)
router.get('/reports', protect, async (req, res) => {
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
    
    if (course) {
      const students = await Student.findAll({
        where: { courseApplied: course },
        attributes: ['id']
      });
      const studentIds = students.map(s => s.id);
      if (studentIds.length === 0) {
        return res.json({ daily: [], monthly: [], yearly: [] });
      }
      where.studentId = { [Op.in]: studentIds };
    }

    // Daily summaries
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

    // Monthly summaries
    const monthly = await FeePayment.findAll({
      where,
      attributes: [
        [sequelize.literal('YEAR(paymentDate)'), 'year'],
        [sequelize.literal('MONTH(paymentDate)'), 'month'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount']
      ],
      group: [sequelize.literal('YEAR(paymentDate)'), sequelize.literal('MONTH(paymentDate)')],
      order: [
        [sequelize.literal('YEAR(paymentDate)'), 'DESC'],
        [sequelize.literal('MONTH(paymentDate)'), 'DESC']
      ]
    });

    // Yearly summaries
    const yearly = await FeePayment.findAll({
      where,
      attributes: [
        [sequelize.literal('YEAR(paymentDate)'), 'year'],
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount']
      ],
      group: [sequelize.literal('YEAR(paymentDate)')],
      order: [[sequelize.literal('YEAR(paymentDate)'), 'DESC']]
    });

    res.json({ daily, monthly, yearly });
  } catch (error) {
    console.error('[Fees Reports GET] error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error generating fees reports' });
  }
});

module.exports = router;
