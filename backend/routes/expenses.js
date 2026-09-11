const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');
const { sequelize } = require('../config/db');

const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// Setup Multer storage for expense receipt attachments
const isPackaged = typeof process.pkg !== 'undefined';
const uploadDir = isPackaged 
  ? path.join(path.dirname(process.execPath), 'uploads', 'expenses') 
  : path.join(__dirname, '..', '..', 'uploads', 'expenses');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `exp-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|pdf|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPG, PNG, WEBP) and PDF documents are allowed for receipts.'));
  }
});

const STANDARD_EXPENSE_CATEGORIES = [
  'Stationery & Printing',
  'Electricity & Utilities',
  'Building & Campus Maintenance',
  'Tea & Refreshments / Hospitality',
  'Lab & Library Consumables',
  'Staff Welfare & Honorarium',
  'Affiliation & Legal Fees',
  'Security & Sanitization',
  'Sports & Cultural Events',
  'Miscellaneous & Petty Cash'
];

// Helper to generate sequential voucher number EXP-YYYY-XXXX
async function generateVoucherNo(dateStr, t) {
  const year = dateStr ? new Date(dateStr).getFullYear() : new Date().getFullYear();
  const prefix = `EXP-${year}-`;
  
  const count = await Expense.count({
    where: {
      voucherNo: {
        [Op.like]: `${prefix}%`
      }
    },
    transaction: t
  });

  const nextSeq = count + 1;
  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// @desc    Get All Expenses with Filters, Pagination & Stats
// @route   GET /api/expenses
// @access  Private
router.get('/', protect, async (req, res) => {
  const { 
    startDate, 
    endDate, 
    category, 
    paymentMode, 
    session, 
    search, 
    page = 1, 
    limit = 25 
  } = req.query;

  try {
    const where = {};

    if (startDate && endDate) {
      where.expenseDate = { [Op.between]: [startDate, endDate] };
    } else if (startDate) {
      where.expenseDate = { [Op.gte]: startDate };
    } else if (endDate) {
      where.expenseDate = { [Op.lte]: endDate };
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (paymentMode && paymentMode !== 'All') {
      where.paymentMode = paymentMode;
    }

    if (session && session !== 'All' && session !== 'All Sessions') {
      where.academicSession = session;
    }

    if (search) {
      where[Op.or] = [
        { voucherNo: { [Op.like]: `%${search}%` } },
        { paidTo: { [Op.like]: `%${search}%` } },
        { narration: { [Op.like]: `%${search}%` } },
        { transactionRef: { [Op.like]: `%${search}%` } }
      ];
    }

    // 1. Calculate Summary Stats for filtered period
    const allMatching = await Expense.findAll({ where });
    let totalAmount = 0;
    let cashTotal = 0;
    let bankTotal = 0;
    const categoryBreakdown = {};

    allMatching.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalAmount += amt;

      const pMode = (exp.paymentMode || '').toLowerCase();
      if (pMode === 'cash') {
        cashTotal += amt;
      } else {
        bankTotal += amt;
      }

      const cat = exp.category || 'Miscellaneous & Petty Cash';
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
    });

    // 2. Paginated results
    const { count, rows } = await Expense.findAndCountAll({
      where,
      order: [['expenseDate', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit)
    });

    res.json({
      stats: {
        totalAmount,
        cashTotal,
        bankTotal,
        totalCount: allMatching.length,
        categoryBreakdown
      },
      expenses: rows.map(mapId),
      page: Number(page),
      pages: Math.ceil(count / Number(limit)) || 1,
      total: count
    });
  } catch (error) {
    console.error('[Expenses GET] error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error retrieving expenses register' });
  }
});

// @desc    Get Expense Categories List
// @route   GET /api/expenses/categories
// @access  Private
router.get('/categories', protect, async (req, res) => {
  try {
    const distinctDbCategories = await Expense.findAll({
      attributes: ['category'],
      group: ['category']
    });

    const set = new Set([...STANDARD_EXPENSE_CATEGORIES, ...distinctDbCategories.map(c => c.category).filter(Boolean)]);
    res.json(Array.from(set));
  } catch (error) {
    console.error('[Expense Categories] error:', error.message);
    res.json(STANDARD_EXPENSE_CATEGORIES);
  }
});

// @desc    Create a New Expense / Debit Voucher
// @route   POST /api/expenses
// @access  Private
router.post('/', protect, upload.single('receiptFile'), async (req, res) => {
  const {
    paidTo,
    amount,
    category,
    expenseDate,
    paymentMode,
    transactionRef,
    narration,
    academicSession,
    authorizedBy
  } = req.body;

  if (!paidTo || !paidTo.trim()) {
    return res.status(400).json({ message: 'Payee / Vendor name (Paid To) is required.' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ message: 'Valid positive expense amount is required.' });
  }

  const t = await sequelize.transaction();

  try {
    const expDate = expenseDate || new Date().toISOString().split('T')[0];
    const voucherNo = await generateVoucherNo(expDate, t);

    let receiptFileUrl = '';
    if (req.file) {
      receiptFileUrl = `/uploads/expenses/${req.file.filename}`;
    }

    const newExpense = await Expense.create({
      voucherNo,
      category: category || 'Miscellaneous & Petty Cash',
      expenseDate: expDate,
      paidTo: paidTo.trim(),
      amount: numAmount,
      paymentMode: paymentMode || 'Cash',
      transactionRef: transactionRef ? transactionRef.trim() : '',
      receiptFileUrl,
      narration: narration ? narration.trim() : '',
      academicSession: academicSession || '2025-26',
      authorizedBy: authorizedBy || (req.admin?.name || req.admin?.username || 'SuperAdmin'),
      status: 'APPROVED'
    }, { transaction: t });

    await t.commit();
    res.status(201).json(mapId(newExpense));
  } catch (error) {
    await t.rollback();
    console.error('[Expense Create] error:', error.message, error.stack);
    res.status(500).json({ message: error.message || 'Failed to record expense voucher' });
  }
});

// @desc    Get Single Expense by ID
// @route   GET /api/expenses/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense voucher not found' });
    }
    res.json(mapId(expense));
  } catch (error) {
    console.error('[Expense Single GET] error:', error.message);
    res.status(500).json({ message: 'Error fetching expense details' });
  }
});

// @desc    Update an Existing Expense
// @route   PUT /api/expenses/:id
// @access  Private
router.put('/:id', protect, upload.single('receiptFile'), async (req, res) => {
  const {
    paidTo,
    amount,
    category,
    expenseDate,
    paymentMode,
    transactionRef,
    narration,
    academicSession,
    authorizedBy
  } = req.body;

  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense voucher not found' });
    }

    if (paidTo !== undefined) expense.paidTo = paidTo.trim();
    if (amount !== undefined) {
      const numAmt = Number(amount);
      if (isNaN(numAmt) || numAmt <= 0) {
        return res.status(400).json({ message: 'Valid positive amount is required' });
      }
      expense.amount = numAmt;
    }
    if (category !== undefined) expense.category = category;
    if (expenseDate !== undefined) expense.expenseDate = expenseDate;
    if (paymentMode !== undefined) expense.paymentMode = paymentMode;
    if (transactionRef !== undefined) expense.transactionRef = transactionRef;
    if (narration !== undefined) expense.narration = narration;
    if (academicSession !== undefined) expense.academicSession = academicSession;
    if (authorizedBy !== undefined) expense.authorizedBy = authorizedBy;

    if (req.file) {
      expense.receiptFileUrl = `/uploads/expenses/${req.file.filename}`;
    }

    await expense.save();
    res.json(mapId(expense));
  } catch (error) {
    console.error('[Expense PUT] error:', error.message);
    res.status(500).json({ message: 'Failed to update expense voucher' });
  }
});

// @desc    Delete an Expense Voucher
// @route   DELETE /api/expenses/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const expense = await Expense.findByPk(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense voucher not found' });
    }

    // Attempt to remove receipt file if exists
    if (expense.receiptFileUrl) {
      try {
        const filePath = path.join(__dirname, '..', '..', expense.receiptFileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (e) {}
    }

    await expense.destroy();
    res.json({ message: 'Expense voucher removed successfully' });
  } catch (error) {
    console.error('[Expense DELETE] error:', error.message);
    res.status(500).json({ message: 'Failed to delete expense voucher' });
  }
});

module.exports = router;
