const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');
const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const Expense = require('../models/Expense');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// ==========================================
// 1. UNIFIED DAY BOOK (DOUBLE-ENTRY DAILY REGISTER)
// ==========================================
// @desc    Get Unified Day Book (Inflows & Outflows with Opening & Running Balance)
// @route   GET /api/reports/day-book
// @access  Private
router.get('/day-book', protect, async (req, res) => {
  const { date, startDate, endDate, session, paymentMode } = req.query;

  try {
    const fromDate = startDate || date || new Date().toISOString().split('T')[0];
    const toDate = endDate || date || fromDate;

    // ----------------------------------------------------
    // Step 1: Calculate Opening Balance Prior to fromDate
    // ----------------------------------------------------
    const priorFeeWhere = {
      paymentDate: { [Op.lt]: fromDate }
    };
    const priorExpWhere = {
      expenseDate: { [Op.lt]: fromDate }
    };

    if (session && session !== 'All' && session !== 'All Sessions') {
      priorFeeWhere.academicSession = session;
      priorExpWhere.academicSession = session;
    }

    const priorFees = await FeePayment.findAll({ where: priorFeeWhere });
    const priorExpenses = await Expense.findAll({ where: priorExpWhere });

    let openingCash = 0;
    let openingBank = 0;

    priorFees.forEach(f => {
      const amt = Number(f.amountPaid) || 0;
      const mode = (f.paymentMode || '').toLowerCase();
      if (mode === 'cash') {
        openingCash += amt;
      } else {
        openingBank += amt;
      }
    });

    priorExpenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      const mode = (e.paymentMode || '').toLowerCase();
      if (mode === 'cash') {
        openingCash -= amt;
      } else {
        openingBank -= amt;
      }
    });

    const openingBalance = openingCash + openingBank;

    // ----------------------------------------------------
    // Step 2: Fetch Inflows (Fee Payments) in Range
    // ----------------------------------------------------
    const feeWhere = {
      paymentDate: { [Op.between]: [fromDate, toDate] }
    };
    if (paymentMode && paymentMode !== 'All') {
      feeWhere.paymentMode = paymentMode;
    }
    const studentWhere = {};
    if (session && session !== 'All' && session !== 'All Sessions') {
      studentWhere.academicSession = session;
      feeWhere.academicSession = session;
    }

    const feePayments = await FeePayment.findAll({
      where: feeWhere,
      include: [{
        model: Student,
        as: 'student',
        attributes: [
          'id', 'fullName', 'registrationId', 'courseApplied', 
          'academicSession', 'currentYear', 'currentSemester', 'mobileNumber', 'fatherName', 'srNo', 'formNo'
        ],
        where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined
      }],
      order: [['paymentDate', 'ASC'], ['createdAt', 'ASC']]
    });

    // ----------------------------------------------------
    // Step 3: Fetch Outflows (Expenses) in Range
    // ----------------------------------------------------
    const expWhere = {
      expenseDate: { [Op.between]: [fromDate, toDate] }
    };
    if (paymentMode && paymentMode !== 'All') {
      expWhere.paymentMode = paymentMode;
    }
    if (session && session !== 'All' && session !== 'All Sessions') {
      expWhere.academicSession = session;
    }

    const expenses = await Expense.findAll({
      where: expWhere,
      order: [['expenseDate', 'ASC'], ['createdAt', 'ASC']]
    });

    // ----------------------------------------------------
    // Step 4: Merge Transactions into Unified Chronological Ledger
    // ----------------------------------------------------
    const unifiedEntries = [];

    // Map fee payments (Credits / Inflows)
    feePayments.forEach(p => {
      const pObj = mapId(p);
      const studentName = pObj.student?.fullName || 'Student';
      const courseInfo = pObj.student?.courseApplied || '';
      const rollOrReg = pObj.student?.registrationId || pObj.student?.srNo || '';

      unifiedEntries.push({
        id: `FEE-${pObj.id}`,
        rawId: pObj.id,
        voucherNo: pObj.receiptNo || `REC-${pObj.id.toString().slice(0, 6).toUpperCase()}`,
        transactionType: 'Credit', // Inflow
        date: pObj.paymentDate,
        createdAt: pObj.createdAt,
        particulars: `${pObj.installmentName || 'Tuition Fee'} — ${studentName} (${courseInfo})`,
        accountHead: pObj.installmentName || 'Tuition / Admission Fees',
        refNo: rollOrReg || pObj.transactionNo || pObj.receiptNo,
        studentName: studentName,
        studentId: pObj.student?.id || pObj.studentId,
        paymentMode: pObj.paymentMode || 'Cash',
        credit: Number(pObj.amountPaid) || 0,
        debit: 0,
        narration: pObj.remarks || '',
        handledBy: 'Fee Desk / Accountant',
        sourceType: 'FEE_PAYMENT',
        receiptData: pObj
      });
    });

    // Map expenses (Debits / Outflows)
    expenses.forEach(e => {
      const eObj = mapId(e);
      unifiedEntries.push({
        id: `EXP-${eObj.id}`,
        rawId: eObj.id,
        voucherNo: eObj.voucherNo,
        transactionType: 'Debit', // Outflow
        date: eObj.expenseDate,
        createdAt: eObj.createdAt,
        particulars: `${eObj.category} — Paid to ${eObj.paidTo}`,
        accountHead: eObj.category || 'Operational Expense',
        refNo: eObj.transactionRef || eObj.voucherNo,
        paidTo: eObj.paidTo,
        paymentMode: eObj.paymentMode || 'Cash',
        credit: 0,
        debit: Number(eObj.amount) || 0,
        narration: eObj.narration || '',
        handledBy: eObj.authorizedBy || 'Accountant',
        sourceType: 'EXPENSE',
        receiptFileUrl: eObj.receiptFileUrl
      });
    });

    // Sort chronologically: Date ASC -> createdAt ASC
    unifiedEntries.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // ----------------------------------------------------
    // Step 5: Compute Dynamic Running Balances
    // ----------------------------------------------------
    let currentBalance = openingBalance;
    let currentCash = openingCash;
    let currentBank = openingBank;

    let totalReceipts = 0;
    let cashReceipts = 0;
    let onlineReceipts = 0;
    let upiReceipts = 0;
    let bankReceipts = 0;
    let chequeReceipts = 0;

    let totalExpenses = 0;
    let cashExpenses = 0;
    let bankExpenses = 0;

    const vouchers = unifiedEntries.map((row, idx) => {
      const isCredit = row.transactionType === 'Credit';
      const mode = (row.paymentMode || '').toLowerCase();

      if (isCredit) {
        currentBalance += row.credit;
        totalReceipts += row.credit;

        if (mode === 'cash') {
          currentCash += row.credit;
          cashReceipts += row.credit;
        } else {
          currentBank += row.credit;
          onlineReceipts += row.credit;
          if (mode === 'upi') upiReceipts += row.credit;
          else if (mode === 'cheque' || mode === 'dd') chequeReceipts += row.credit;
          else bankReceipts += row.credit;
        }
      } else {
        currentBalance -= row.debit;
        totalExpenses += row.debit;

        if (mode === 'cash') {
          currentCash -= row.debit;
          cashExpenses += row.debit;
        } else {
          currentBank -= row.debit;
          bankExpenses += row.debit;
        }
      }

      return {
        ...row,
        srNo: idx + 1,
        runningBalance: currentBalance,
        cashRunningBalance: currentCash,
        bankRunningBalance: currentBank
      };
    });

    res.json({
      startDate: fromDate,
      endDate: toDate,
      openingBalance: {
        total: openingBalance,
        cash: openingCash,
        bank: openingBank
      },
      summary: {
        totalReceipts,
        cashReceipts,
        onlineReceipts,
        upiReceipts,
        bankReceipts,
        chequeReceipts,
        totalExpenses,
        cashExpenses,
        bankExpenses,
        netCashflow: totalReceipts - totalExpenses,
        closingBalance: currentBalance,
        closingCash: currentCash,
        closingBank: currentBank,
        transactionCount: vouchers.length
      },
      vouchers
    });
  } catch (err) {
    console.error('[Reports Day-Book API] error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error generating day book register' });
  }
});

// ==========================================
// 2. DATE-WISE COLLECTION AUDIT REPORT
// ==========================================
// @desc    Get Detailed Fees Posting List / Collection Register
// @route   GET /api/reports/fees-posting
// @access  Private
router.get('/fees-posting', protect, async (req, res) => {
  const { startDate, endDate, session, course, paymentMode, feeHead, search, page = 1, limit = 50 } = req.query;

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
    if (session && session !== 'All' && session !== 'All Sessions') {
      studentWhere.academicSession = session;
    }
    if (course && course !== 'All') {
      studentWhere.courseApplied = course;
    }
    if (search) {
      studentWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { registrationId: { [Op.like]: `%${search}%` } },
        { mobileNumber: { [Op.like]: `%${search}%` } },
        { fatherName: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: transactions } = await FeePayment.findAndCountAll({
      where,
      include: [{
        model: Student,
        as: 'student',
        attributes: [
          'id', 'fullName', 'registrationId', 'courseApplied', 
          'academicSession', 'currentYear', 'currentSemester', 'mobileNumber', 'fatherName', 'srNo', 'formNo'
        ],
        where: Object.keys(studentWhere).length > 0 ? studentWhere : undefined
      }],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']]
    });

    let totalAmount = 0;
    const modeBreakdown = { Cash: 0, UPI: 0, Bank: 0, Cheque: 0, Online: 0, Other: 0 };
    const headBreakdown = {};

    const records = transactions.map((t, index) => {
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
        modeBreakdown.Other = (modeBreakdown.Other || 0) + amt;
      }

      const headKey = obj.feeHead;
      headBreakdown[headKey] = (headBreakdown[headKey] || 0) + amt;

      return {
        srNo: index + 1,
        ...obj
      };
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

// ==========================================
// 3. STUDENT OUTSTANDING / DEFAULTER LIST
// ==========================================
// @desc    Get Student Defaulters and Pending Dues List
// @route   GET /api/reports/defaulters
// @access  Private
router.get('/defaulters', protect, async (req, res) => {
  const { session, course, minDue = 1, search } = req.query;

  try {
    const studentWhere = {};
    if (session && session !== 'All' && session !== 'All Sessions') {
      studentWhere.academicSession = session;
    }
    if (course && course !== 'All') {
      studentWhere.courseApplied = course;
    }
    if (search) {
      studentWhere[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { registrationId: { [Op.like]: `%${search}%` } },
        { mobileNumber: { [Op.like]: `%${search}%` } },
        { fatherName: { [Op.like]: `%${search}%` } }
      ];
    }

    // 1. Fetch Students with their payments
    const students = await Student.findAll({
      where: studentWhere,
      include: [{
        model: FeePayment,
        as: 'payments',
        attributes: ['id', 'amountPaid', 'amountDue', 'dueDate', 'paymentDate', 'installmentName', 'receiptNo']
      }],
      order: [['fullName', 'ASC']]
    });

    // 2. Fetch Course Master Fee map
    const courses = await Course.findAll();
    const courseFeeMap = {};
    courses.forEach(c => {
      courseFeeMap[c.name] = Number(c.totalFee) || 25000;
      if (c.code) courseFeeMap[c.code] = Number(c.totalFee) || 25000;
    });

    let totalExpectedFees = 0;
    let totalCollectedFees = 0;
    let totalOutstandingDueFees = 0;
    const defaulters = [];

    students.forEach((s, idx) => {
      const sObj = mapId(s);
      const payments = sObj.payments || [];
      
      const courseTotal = courseFeeMap[sObj.courseApplied] || 25000;
      totalExpectedFees += courseTotal;

      let studentPaid = 0;
      let lastPaymentDate = null;
      let latestDueDate = null;

      payments.forEach(p => {
        studentPaid += Number(p.amountPaid) || 0;
        if (p.paymentDate && (!lastPaymentDate || new Date(p.paymentDate) > new Date(lastPaymentDate))) {
          lastPaymentDate = p.paymentDate;
        }
        if (p.dueDate && (!latestDueDate || new Date(p.dueDate) > new Date(latestDueDate))) {
          latestDueDate = p.dueDate;
        }
      });

      totalCollectedFees += studentPaid;
      const balanceDue = Math.max(0, courseTotal - studentPaid);
      totalOutstandingDueFees += balanceDue;

      if (balanceDue >= Number(minDue)) {
        defaulters.push({
          srNo: defaulters.length + 1,
          studentId: sObj.id,
          fullName: sObj.fullName,
          fatherName: sObj.fatherName || 'N/A',
          registrationId: sObj.registrationId || sObj.srNo || 'N/A',
          enrollmentNo: sObj.srNo || sObj.formNo || 'N/A',
          mobileNumber: sObj.mobileNumber || 'N/A',
          courseApplied: sObj.courseApplied,
          currentYear: sObj.currentYear || '1st Year',
          currentSemester: sObj.currentSemester || 'Annual',
          academicSession: sObj.academicSession || '2025-26',
          totalCourseFee: courseTotal,
          totalPaid: studentPaid,
          balanceDue: balanceDue,
          dueDate: latestDueDate || 'Immediate',
          lastPaymentDate: lastPaymentDate || 'No payments recorded',
          paymentCount: payments.length,
          status: studentPaid === 0 ? 'UNPAID' : 'PARTIAL'
        });
      }
    });

    res.json({
      summary: {
        totalDefaultersCount: defaulters.length,
        totalStudentsEvaluated: students.length,
        totalExpectedFees,
        totalCollectedFees,
        totalOutstandingDueFees,
        collectionPercentage: totalExpectedFees > 0 ? ((totalCollectedFees / totalExpectedFees) * 100).toFixed(1) : 0
      },
      defaulters
    });
  } catch (err) {
    console.error('[Reports Defaulters API] error:', err.message, err.stack);
    res.status(500).json({ message: 'Server error generating defaulters report' });
  }
});

// ==========================================
// 4. HEAD-WISE FEE SUMMARY
// ==========================================
// @desc    Get Head-Wise Fee Summary (Expected vs Collected vs Pending)
// @route   GET /api/reports/head-summary
// @access  Private
router.get('/head-summary', protect, async (req, res) => {
  const { session, course } = req.query;

  try {
    const studentWhere = {};
    const paymentWhere = {};

    if (session && session !== 'All' && session !== 'All Sessions') {
      studentWhere.academicSession = session;
      paymentWhere.academicSession = session;
    }
    if (course && course !== 'All') {
      studentWhere.courseApplied = course;
    }

    const students = await Student.findAll({ where: studentWhere });
    const studentCount = students.length;

    // Fetch payments grouped by installmentName / fee head
    const payments = await FeePayment.findAll({
      where: paymentWhere,
      attributes: [
        'installmentName',
        [sequelize.fn('SUM', sequelize.col('amountPaid')), 'totalCollected'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'paymentCount']
      ],
      group: ['installmentName']
    });

    // Standard heads map
    const defaultHeads = [
      { name: '1st Installment / Admission Fee', defaultRate: 16000 },
      { name: '2nd Installment / Examination Fee', defaultRate: 9000 },
      { name: 'Caution Money (Refundable)', defaultRate: 300 },
      { name: 'Provisional Promotion Fee', defaultRate: 300 },
      { name: 'Miscellaneous / Library Fine', defaultRate: 0 }
    ];

    const collectedMap = {};
    payments.forEach(p => {
      const head = p.installmentName || 'General / Tuition';
      collectedMap[head] = Number(p.get('totalCollected')) || 0;
    });

    let grandTotalExpected = 0;
    let grandTotalCollected = 0;
    let grandTotalPending = 0;

    const headBreakdown = defaultHeads.map(head => {
      const collected = collectedMap[head.name] || 
        (head.name.includes('1st') ? (collectedMap['1st Installment'] || collectedMap['First Installment'] || 0) : 0) ||
        (head.name.includes('2nd') ? (collectedMap['2nd Installment'] || collectedMap['Second Installment'] || 0) : 0) ||
        (head.name.includes('Caution') ? (collectedMap['Caution Money'] || 0) : 0) ||
        0;

      const expected = head.defaultRate * studentCount;
      const pending = Math.max(0, expected - collected);

      grandTotalExpected += expected;
      grandTotalCollected += collected;
      grandTotalPending += pending;

      return {
        feeHead: head.name,
        perStudentRate: head.defaultRate,
        studentCount,
        totalExpected: expected,
        totalCollected: collected,
        totalPending: pending,
        collectionPercentage: expected > 0 ? ((collected / expected) * 100).toFixed(1) : (collected > 0 ? 100 : 0)
      };
    });

    res.json({
      studentCount,
      grandTotals: {
        grandTotalExpected,
        grandTotalCollected,
        grandTotalPending,
        overallPercentage: grandTotalExpected > 0 ? ((grandTotalCollected / grandTotalExpected) * 100).toFixed(1) : 0
      },
      headBreakdown
    });
  } catch (err) {
    console.error('[Reports Head-Summary API] error:', err.message);
    res.status(500).json({ message: 'Server error generating head-wise fee summary' });
  }
});

// ==========================================
// 5. EXISTING FEES ANALYTICS & ADMISSIONS
// ==========================================
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

    const isSqlite = sequelize.getDialect() === 'sqlite';
    const yearFn = isSqlite ? "strftime('%Y', paymentDate)" : "YEAR(paymentDate)";
    const monthFn = isSqlite ? "strftime('%m', paymentDate)" : "MONTH(paymentDate)";

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

router.get('/admissions', protect, async (req, res) => {
  const { startDate, endDate, course, status, category } = req.query;

  try {
    const where = {};
    if (startDate && endDate) {
      where.createdAt = { [Op.between]: [new Date(startDate), new Date(endDate + 'T23:59:59.999Z')] };
    } else if (startDate) {
      where.createdAt = { [Op.gte]: new Date(startDate) };
    } else if (endDate) {
      where.createdAt = { [Op.lte]: new Date(endDate + 'T23:59:59.999Z') };
    }

    if (course) where.courseApplied = course;
    if (status) where.verificationStatus = status;
    if (category) where.category = category;

    const students = await Student.findAll({
      where,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 'registrationId', 'fullName', 'courseApplied', 'gender', 
        'category', 'mobileNumber', 'email', 'verificationStatus', 'createdAt'
      ]
    });

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
      daily: daily.map(d => ({ date: d.get('date'), count: d.get('count') })),
      monthly: monthly.map(m => ({ year: m.get('year'), month: m.get('month'), count: m.get('count') })),
      courseStats,
      logs: students.map(s => {
        const obj = mapId(s);
        obj._id = obj.id;
        return obj;
      })
    });
  } catch (err) {
    console.error('[Reports Admissions API] error:', err.message);
    res.status(500).json({ message: 'Server error generating admissions report' });
  }
});

module.exports = router;
