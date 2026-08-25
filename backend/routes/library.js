const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// Helper to map UUID 'id' to '_id' for client compatibility
const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// ─── CATALOG INVENTORY ROUTES ───

// @desc    Get book catalog with filters
// @route   GET /api/library/books
// @access  Private
router.get('/books', protect, async (req, res) => {
  const { search, subject, page = 1, limit = 20, includeHidden } = req.query;
  const where = {};

  if (includeHidden !== 'true') {
    where.isHidden = { [Op.ne]: true };
  }

  if (subject) where.subject = subject;

  if (search) {
    where[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { author: { [Op.like]: `%${search}%` } },
      { bookNo: { [Op.like]: `%${search}%` } }
    ];
  }

  try {
    const { count, rows: books } = await Book.findAndCountAll({
      where,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['title', 'ASC']]
    });

    res.json({
      books: books.map(mapId),
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      total: count
    });
  } catch (error) {
    console.error('[Library Books GET] error:', error.message);
    res.status(500).json({ message: 'Server error loading library catalog' });
  }
});

// @desc    Add a book to catalog
router.post('/books', protect, async (req, res) => {
  const { bookNo, title, author, publisher, subject, totalCopies, shelfLocation, remarks, price, isHidden } = req.body;

  try {
    // Check duplication
    const duplicate = await Book.findOne({ where: { bookNo } });
    if (duplicate) {
      return res.status(400).json({ message: `Book Accession No #${bookNo} already exists in library catalog` });
    }

    const book = await Book.create({
      bookNo,
      title,
      author,
      publisher: publisher || '',
      subject: subject || '',
      totalCopies: Number(totalCopies) || 1,
      availableCopies: Number(totalCopies) || 1,
      shelfLocation: shelfLocation || '',
      remarks: remarks || '',
      price: price ? Number(price) : null,
      isHidden: isHidden === true || isHidden === 'true'
    });

    res.status(201).json(mapId(book));
  } catch (error) {
    console.error('[Library Books POST] error:', error.message);
    res.status(500).json({ message: 'Server error adding book to catalog' });
  }
});

// @desc    Update book details
// @route   PUT /api/library/books/:id
// @access  Private
router.put('/books/:id', protect, async (req, res) => {
  const { bookNo, title, author, publisher, subject, totalCopies, shelfLocation, remarks, price, isHidden } = req.body;

  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book catalog item not found' });
    }

    // Check duplicate bookNo
    if (bookNo && bookNo !== book.bookNo) {
      const duplicate = await Book.findOne({ where: { bookNo } });
      if (duplicate) {
        return res.status(400).json({ message: `Book Accession No #${bookNo} is already registered` });
      }
    }

    const copyDifference = (Number(totalCopies) || book.totalCopies) - book.totalCopies;

    book.bookNo = bookNo !== undefined ? bookNo : book.bookNo;
    book.title = title !== undefined ? title : book.title;
    book.author = author !== undefined ? author : book.author;
    book.publisher = publisher !== undefined ? publisher : book.publisher;
    book.subject = subject !== undefined ? subject : book.subject;
    book.totalCopies = totalCopies !== undefined ? Number(totalCopies) : book.totalCopies;
    book.availableCopies = Math.max(0, book.availableCopies + copyDifference);
    book.shelfLocation = shelfLocation !== undefined ? shelfLocation : book.shelfLocation;
    book.remarks = remarks !== undefined ? remarks : book.remarks;
    book.price = price !== undefined ? (price ? Number(price) : null) : book.price;
    book.isHidden = isHidden !== undefined ? (isHidden === true || isHidden === 'true') : book.isHidden;

    await book.save();
    res.json(mapId(book));
  } catch (error) {
    console.error('[Library Books PUT] error:', error.message);
    res.status(500).json({ message: 'Server error modifying book details' });
  }
});

// @desc    Delete book catalog item
// @route   DELETE /api/library/books/:id
// @access  Private
router.delete('/books/:id', protect, async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book catalog item not found' });
    }

    // Check if book currently has active issues
    const activeIssue = await BookIssue.findOne({ where: { bookId: req.params.id, status: 'Issued' } });
    if (activeIssue) {
      return res.status(400).json({ message: 'Cannot delete book catalog item while copies are currently issued to students' });
    }

    await book.destroy();
    res.json({ message: 'Book catalog item deleted successfully' });
  } catch (error) {
    console.error('[Library Books DELETE] error:', error.message);
    res.status(500).json({ message: 'Server error deleting book from catalog' });
  }
});

// ─── BOOK TRANSACTION ROUTES (ISSUE, RETURN, OVERDUE) ───

// @desc    Get central library transactions list
// @route   GET /api/library/issues
// @access  Private
router.get('/issues', protect, async (req, res) => {
  const { status, studentId, search, page = 1, limit = 20 } = req.query;
  const where = {};

  if (status) where.status = status;
  if (studentId) where.studentId = studentId;

  try {
    const includeOptions = [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'fullName', 'registrationId', 'srNo', 'courseApplied']
      },
      {
        model: Book,
        as: 'book',
        attributes: ['id', 'bookNo', 'title', 'author', 'shelfLocation']
      }
    ];

    if (search) {
      includeOptions[0].where = {
        [Op.or]: [
          { fullName: { [Op.like]: `%${search}%` } },
          { registrationId: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows: issues } = await BookIssue.findAndCountAll({
      where,
      include: includeOptions,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['issueDate', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      issues: issues.map(issue => {
        const item = mapId(issue);
        if (item.student) item.student = mapId(item.student);
        if (item.book) item.book = mapId(item.book);
        return item;
      }),
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      total: count
    });
  } catch (error) {
    console.error('[Library Issues GET] error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error loading transaction logs' });
  }
});

// @desc    Issue a book to a student
// @route   POST /api/library/issue
// @access  Private
router.post('/issue', protect, async (req, res) => {
  const { studentId, bookNo, bookNos, issueDate, dueDate, remarks } = req.body;

  try {
    // 1. Verify student exists
    const student = await Student.findByPk(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Target student not found in registry' });
    }

    const finalBookNos = Array.isArray(bookNos) ? bookNos : [bookNo].filter(Boolean);
    if (finalBookNos.length === 0) {
      return res.status(400).json({ message: 'No books selected for checkout' });
    }

    const results = [];
    const errors = [];

    for (const bNo of finalBookNos) {
      // 2. Verify book exists by accession number
      const book = await Book.findOne({ where: { bookNo: bNo } });
      if (!book) {
        errors.push(`Book #${bNo} not found in catalog`);
        continue;
      }

      // 3. Verify copies available
      if (book.availableCopies <= 0) {
        errors.push(`No copies available for "${book.title}"`);
        continue;
      }

      // 4. Check if student already has this book issued currently
      const alreadyIssued = await BookIssue.findOne({
        where: { studentId: student.id, bookId: book.id, status: 'Issued' }
      });
      if (alreadyIssued) {
        errors.push(`Student already holds an active checkout for "${book.title}"`);
        continue;
      }

      // Default dates
      const finalIssueDate = issueDate || new Date().toISOString().split('T')[0];
      let finalDueDate = dueDate;
      if (!finalDueDate) {
        const date = new Date(finalIssueDate);
        date.setDate(date.getDate() + 14); // 14-days library checkout period
        finalDueDate = date.toISOString().split('T')[0];
      }

      // 5. Create transaction and decrement available count
      const transaction = await BookIssue.create({
        studentId: student.id,
        bookId: book.id,
        issueDate: finalIssueDate,
        dueDate: finalDueDate,
        status: 'Issued',
        remarks: remarks || ''
      });

      book.availableCopies = Math.max(0, book.availableCopies - 1);
      await book.save();

      results.push(mapId(transaction));
    }

    if (errors.length > 0 && results.length === 0) {
      return res.status(400).json({ message: errors.join('. ') });
    }

    if (Array.isArray(bookNos)) {
      res.status(201).json({
        success: true,
        issued: results,
        errors: errors.length > 0 ? errors : null
      });
    } else {
      res.status(201).json(results[0]);
    }
  } catch (error) {
    console.error('[Library Issue POST] error:', error.message);
    res.status(500).json({ message: 'Server error processing book checkout' });
  }
});

// @desc    Return an issued book
// @route   POST /api/library/return/:issueId
// @access  Private
router.post('/return/:issueId', protect, async (req, res) => {
  const { returnDate, remarks } = req.body;

  try {
    const issue = await BookIssue.findByPk(req.params.issueId, {
      include: [{ model: Book, as: 'book' }]
    });

    if (!issue) {
      return res.status(404).json({ message: 'Library transaction record not found' });
    }

    if (issue.status !== 'Issued') {
      return res.status(400).json({ message: `This checkout transaction is already closed (Status: ${issue.status})` });
    }

    const finalReturnDate = returnDate || new Date().toISOString().split('T')[0];

    // Calculate late fines (e.g. 5 rupees per day late)
    const due = new Date(issue.dueDate);
    const ret = new Date(finalReturnDate);
    let fine = 0.0;

    if (ret > due) {
      const diffTime = Math.abs(ret - due);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      fine = diffDays * 5.0; // ₹5 per day penalty
    }

    // Update issue state
    issue.returnDate = finalReturnDate;
    issue.status = 'Returned';
    issue.fineAmount = fine;
    if (remarks) issue.remarks = remarks;
    await issue.save();

    // Increment book catalog counts
    if (issue.book) {
      issue.book.availableCopies = Math.min(issue.book.totalCopies, issue.book.availableCopies + 1);
      await issue.book.save();
    }

    res.json(mapId(issue));
  } catch (error) {
    console.error('[Library Return POST] error:', error.message);
    res.status(500).json({ message: 'Server error processing book return' });
  }
});

// @desc    Mark an issued book as lost
// @route   POST /api/library/lost/:issueId
// @access  Private
router.post('/lost/:issueId', protect, async (req, res) => {
  const { remarks } = req.body;

  try {
    const issue = await BookIssue.findByPk(req.params.issueId, {
      include: [{ model: Book, as: 'book' }]
    });

    if (!issue) {
      return res.status(404).json({ message: 'Library transaction record not found' });
    }

    if (issue.status !== 'Issued') {
      return res.status(400).json({ message: `This transaction cannot be marked as lost (Status: ${issue.status})` });
    }

    // Determine fine amount based on book price or default settings
    let replacementFine = 400.0;
    try {
      const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        if (settings.defaultBookPrice !== undefined) {
          replacementFine = Number(settings.defaultBookPrice);
        }
      }
    } catch (e) {
      console.error('[Library Settings] Error reading settings in lost route:', e.message);
    }

    if (issue.book && issue.book.price !== null && issue.book.price !== undefined && issue.book.price > 0) {
      replacementFine = Number(issue.book.price);
    }

    issue.status = 'Lost';
    issue.fineAmount = replacementFine;
    if (remarks) issue.remarks = remarks;
    await issue.save();

    // Decrement total copies count in catalog permanently
    if (issue.book) {
      issue.book.totalCopies = Math.max(0, issue.book.totalCopies - 1);
      await issue.book.save();
    }

    res.json(mapId(issue));
  } catch (error) {
    console.error('[Library Lost POST] error:', error.message);
    res.status(500).json({ message: 'Server error marking book copy as lost' });
  }
});

// @desc    Get library dashboard summaries
// @route   GET /api/library/dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const totalBooks = await Book.sum('totalCopies') || 0;
    const activeIssues = await BookIssue.count({ where: { status: 'Issued' } });
    
    // Count overdue issues (due date before today and not returned yet)
    const today = new Date().toISOString().split('T')[0];
    const overdueIssues = await BookIssue.count({
      where: {
        status: 'Issued',
        dueDate: { [Op.lt]: today }
      }
    });

    const totalFines = await BookIssue.sum('fineAmount') || 0.0;

    res.json({
      totalBooks,
      activeIssues,
      overdueIssues,
      totalFines
    });
  } catch (error) {
    console.error('[Library Dashboard GET] error:', error.message);
    res.status(500).json({ message: 'Server error loading library dashboard statistics' });
  }
});

// @desc    Get library settings
// @route   GET /api/library/settings
// @access  Private
router.get('/settings', protect, async (req, res) => {
  try {
    const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    
    let settings = { defaultBookPrice: 400.0 };
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } else {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    }
    res.json(settings);
  } catch (error) {
    console.error('[Library Settings GET] error:', error.message);
    res.status(500).json({ message: 'Server error loading library settings' });
  }
});

// @desc    Save library settings
// @route   POST /api/library/settings
// @access  Private
router.post('/settings', protect, async (req, res) => {
  const { defaultBookPrice } = req.body;
  try {
    const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    
    let settings = { defaultBookPrice: 400.0 };
    if (fs.existsSync(settingsPath)) {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    }
    
    if (defaultBookPrice !== undefined) {
      settings.defaultBookPrice = Number(defaultBookPrice);
    }
    
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    res.json(settings);
  } catch (error) {
    console.error('[Library Settings POST] error:', error.message);
    res.status(500).json({ message: 'Server error saving library settings' });
  }
});

module.exports = router;
