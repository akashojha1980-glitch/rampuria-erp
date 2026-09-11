const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Student = require('../models/Student');
const Course = require('../models/Course');
const FeePayment = require('../models/FeePayment');
const BookIssue = require('../models/BookIssue');
const Book = require('../models/Book');
const Result = require('../models/Result');
const AppSetting = require('../models/AppSetting');
const { getRegConfig, formatRegId } = require('./settings');
const { protect } = require('../middleware/auth');

const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// Setup document storage configurations
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isPackaged = typeof process.pkg !== 'undefined';
    const uploadDir = isPackaged 
      ? path.join(path.dirname(process.execPath), 'uploads') 
      : path.join(__dirname, '..', '..', 'uploads');
      
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
  }
});

// Helper to generate Registration ID
const generateRegistrationId = () => {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(10000 + Math.random() * 90000);
  return `REG-${year}-${randomDigits}`;
};

const studentUploadFields = [
  { name: 'photo', maxCount: 1 },
  { name: 'signature', maxCount: 1 },
  { name: 'marksheet10', maxCount: 1 },
  { name: 'marksheet12', maxCount: 1 },
  { name: 'casteCertificate', maxCount: 1 },
  { name: 'aadharCard', maxCount: 1 },
  { name: 'domicileCertificate', maxCount: 1 }
];

// @desc    Register a new student
// @route   POST /api/students
// @access  Private (Terminal authenticated desk)
router.post('/', protect, upload.fields(studentUploadFields), async (req, res) => {
  try {
    const data = req.body;

    // Check if email exists
    const emailExists = await Student.findOne({ where: { email: data.email } });
    if (emailExists) {
      return res.status(400).json({ message: 'A student with this email is already registered' });
    }

    // Auto-generate Registration ID and check duplicates
    let registrationId = generateRegistrationId();
    let idExists = await Student.findOne({ where: { registrationId } });
    while (idExists) {
      registrationId = generateRegistrationId();
      idExists = await Student.findOne({ where: { registrationId } });
    }

    // Auto-generate unique incremental SR No
    const lastStudent = await Student.findOne({
      attributes: ['srNo'],
      order: [['srNo', 'DESC']]
    });
    const srNo = lastStudent && lastStudent.srNo ? lastStudent.srNo + 1 : 1;

    const files = req.files || {};
    const getFilename = (fieldName) => files[fieldName] ? files[fieldName][0].filename : '';

    const createdStudent = await Student.create({
      srNo,
      registrationId,
      fullName: data.fullName,
      fatherName: data.fatherName,
      motherName: data.motherName,
      mobileNumber: data.mobileNumber,
      alternateMobile: data.alternateMobile || '',
      email: data.email,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth,
      address: data.address,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
      category: data.category || 'General',
      courseApplied: data.courseApplied,
      // Academic details
      marks10: Number(data.marks10),
      board10: data.board10,
      passingYear10: data.passingYear10,
      marks12: Number(data.marks12),
      board12: data.board12,
      passingYear12: data.passingYear12,
      subject12: data.subject12,
      // New admission form fields
      admissionBase: data.admissionBase || 'UG',
      formNo: data.formNo || '',
      studentAccNo: data.studentAccNo || '',
      medium: data.medium || 'English',
      permanentAddress: data.permanentAddress || '',
      parentsContact: data.parentsContact || '',
      whatsAppNo: data.whatsAppNo || '',
      aadharNo: data.aadharNo || '',
      yearlyIncomeFather: data.yearlyIncomeFather ? Number(data.yearlyIncomeFather) : 0.0,
      yearlyIncomeMother: data.yearlyIncomeMother ? Number(data.yearlyIncomeMother) : 0.0,
      // Qualifying Exam
      qualExamName: data.qualExamName || '',
      qualUniversity: data.qualUniversity || '',
      qualType: data.qualType || '',
      qualYear: data.qualYear || '',
      qualMaxMarks: data.qualMaxMarks ? Number(data.qualMaxMarks) : 0,
      qualObtainedMarks: data.qualObtainedMarks ? Number(data.qualObtainedMarks) : 0,
      qualPercentage: data.qualPercentage ? Number(data.qualPercentage) : 0.0,
      // Academic breakdown details
      maxMarks10: data.maxMarks10 ? Number(data.maxMarks10) : 0,
      obtainedMarks10: data.obtainedMarks10 ? Number(data.obtainedMarks10) : 0,
      maxMarks12: data.maxMarks12 ? Number(data.maxMarks12) : 0,
      obtainedMarks12: data.obtainedMarks12 ? Number(data.obtainedMarks12) : 0,
      // Graduation
      gradUniversity: data.gradUniversity || '',
      gradYear: data.gradYear || '',
      gradSubject: data.gradSubject || '',
      gradMaxMarks: data.gradMaxMarks ? Number(data.gradMaxMarks) : 0,
      gradObtainedMarks: data.gradObtainedMarks ? Number(data.gradObtainedMarks) : 0,
      gradPercentage: data.gradPercentage ? Number(data.gradPercentage) : 0.0,
      // PG
      pgUniversity: data.pgUniversity || '',
      pgYear: data.pgYear || '',
      pgSubject: data.pgSubject || '',
      pgMaxMarks: data.pgMaxMarks ? Number(data.pgMaxMarks) : 0,
      pgObtainedMarks: data.pgObtainedMarks ? Number(data.pgObtainedMarks) : 0,
      pgPercentage: data.pgPercentage ? Number(data.pgPercentage) : 0.0,
      // Other
      otherExamName: data.otherExamName || '',
      otherUniversity: data.otherUniversity || '',
      otherYear: data.otherYear || '',
      otherSubject: data.otherSubject || '',
      otherMaxMarks: data.otherMaxMarks ? Number(data.otherMaxMarks) : 0,
      otherObtainedMarks: data.otherObtainedMarks ? Number(data.otherObtainedMarks) : 0,
      otherPercentage: data.otherPercentage ? Number(data.otherPercentage) : 0.0,
      // File paths & initial pending validation tags
      documents: {
        photo: { filename: getFilename('photo'), status: 'Pending' },
        signature: { filename: getFilename('signature'), status: 'Pending' },
        marksheet10: { filename: getFilename('marksheet10'), status: 'Pending' },
        marksheet12: { filename: getFilename('marksheet12'), status: 'Pending' },
        casteCertificate: { filename: getFilename('casteCertificate'), status: 'Pending' },
        aadharCard: { filename: getFilename('aadharCard'), status: 'Pending' },
        domicileCertificate: { filename: getFilename('domicileCertificate'), status: 'Pending' }
      }
    });

    res.status(201).json({
      message: 'Student Registration Successful',
      registrationId: createdStudent.registrationId,
      student: mapId(createdStudent)
    });
  } catch (error) {
    console.error('[Students Register] error:', error.message);
    res.status(500).json({ message: error.message || 'Server error saving student registration' });
  }
});

// @desc    Get all students with filters
// @route   GET /api/students
// @access  Private
router.get('/', protect, async (req, res) => {
  const { search, course, category, status, session, page = 1, limit = 20 } = req.query;
  const where = {};

  if (session && session !== 'all') where.academicSession = session;
  if (course) where.courseApplied = course;
  if (category) where.category = category;
  
  if (status === 'verified') {
    where.verificationStatus = 'Verified';
  } else if (status === 'pending') {
    where.verificationStatus = 'Pending';
  } else if (status === 'allotted') {
    where.seatAllotted = true;
  }

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.like]: `%${search}%` } },
      { registrationId: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { mobileNumber: { [Op.like]: `%${search}%` } }
    ];
  }

  try {
    const { count, rows: students } = await Student.findAndCountAll({
      where,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['createdAt', 'DESC']]
    });

    const enrichedStudents = await Promise.all(students.map(async (st) => {
      const obj = mapId(st);
      try {
        const feePayments = await FeePayment.findAll({
          where: { studentId: st.id }
        });
        const totalPaid = feePayments.reduce((acc, f) => acc + (Number(f.amountPaid) || 0), 0);
        const totalDue = feePayments.reduce((acc, f) => acc + (Number(f.amountDue) || 0), 0);
        obj.feeSummary = {
          totalPaid,
          totalDue,
          hasPaidRecord: feePayments.length > 0,
          isCleared: totalDue === 0 && (totalPaid > 0 || feePayments.length > 0)
        };
      } catch (err) {
        obj.feeSummary = { totalPaid: 0, totalDue: 0, hasPaidRecord: false, isCleared: true };
      }
      return obj;
    }));

    res.json({
      students: enrichedStudents,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      total: count
    });
  } catch (error) {
    console.error('[Students List] Get error:', error.message);
    res.status(500).json({ message: 'Server error listing registrations' });
  }
});

// @desc    Get registration summaries and stats
// @route   GET /api/students/stats/summary
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const { session } = req.query;
    const baseWhere = {};
    if (session && session !== 'all') {
      baseWhere.academicSession = session;
    }

    const totalReg = await Student.count({ where: baseWhere });
    const verifiedReg = await Student.count({ 
      where: { 
        ...baseWhere, 
        verificationStatus: { [Op.or]: ['Verified', 'Approved'] } 
      } 
    });
    const pendingReg = await Student.count({ 
      where: { ...baseWhere, verificationStatus: 'Pending' } 
    });
    const allottedReg = await Student.count({ 
      where: { ...baseWhere, seatAllotted: true } 
    });

    const courses = await Course.findAll();
    const byCourse = await Promise.all(courses.map(async (c) => {
      const applied = await Student.count({ where: { ...baseWhere, courseApplied: c.code } });
      const allotted = await Student.count({ where: { ...baseWhere, courseApplied: c.code, seatAllotted: true } });
      return {
        code: c.code,
        name: c.name,
        applied,
        allotted,
        totalSeats: c.totalSeats
      };
    }));

    const byCategory = {
      General: await Student.count({ where: { ...baseWhere, category: 'General' } }),
      OBC: await Student.count({ where: { ...baseWhere, category: 'OBC' } }),
      SC: await Student.count({ where: { ...baseWhere, category: 'SC' } }),
      ST: await Student.count({ where: { ...baseWhere, category: 'ST' } })
    };

    res.json({
      total: totalReg,
      verified: verifiedReg,
      pending: pendingReg,
      allotted: allottedReg,
      byCourse,
      byCategory
    });
  } catch (error) {
    console.error('[Students Stats] summary error:', error.message);
    res.status(500).json({ message: 'Server error loading stats summary' });
  }
});

// @desc    Bulk promote students to next year/semester
// @route   POST /api/students/bulk-promote
// @access  Private
router.post('/bulk-promote', protect, async (req, res) => {
  const { studentIds, currentYear, currentSemester } = req.body;
  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return res.status(400).json({ message: 'No student profiles selected for bulk promotion' });
  }
  
  try {
    await Student.update(
      { currentYear, currentSemester },
      { where: { id: studentIds } }
    );
    res.json({ message: `Successfully promoted ${studentIds.length} students to ${currentYear} - ${currentSemester}` });
  } catch (error) {
    console.error('[Student Bulk Promote POST] error:', error.message);
    res.status(500).json({ message: 'Server error during bulk promotion' });
  }
});

// @desc    Promote a single student to next year/semester
// @route   POST /api/students/:id/promote
// @access  Private
router.post('/:id/promote', protect, async (req, res) => {
  const { currentYear, currentSemester } = req.body;
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }
    
    student.currentYear = currentYear || student.currentYear;
    student.currentSemester = currentSemester || student.currentSemester;
    await student.save();
    
    res.json(mapId(student));
  } catch (error) {
    console.error('[Student Promote POST] error:', error.message);
    res.status(500).json({ message: 'Server error promoting student' });
  }
});

// @desc    Get student profile details
// @route   GET /api/students/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id, {
      include: [
        {
          model: FeePayment,
          as: 'payments'
        },
        {
          model: BookIssue,
          as: 'issues',
          include: [{
            model: Book,
            as: 'book',
            attributes: ['bookNo', 'title', 'author']
          }]
        }
      ]
    });
    if (!student) {
      return res.status(404).json({ message: 'Student details not found' });
    }
    
    // Format response to map UUID 'id' to '_id' for backward compatibility
    const studentObj = mapId(student);
    if (studentObj.payments) {
      studentObj.payments = studentObj.payments.map(p => {
        p._id = p.id;
        return p;
      });
    }
    if (studentObj.issues) {
      studentObj.issues = studentObj.issues.map(i => {
        i._id = i.id;
        if (i.book) i.book._id = i.book.id;
        return i;
      });
    }
    
    res.json(studentObj);
  } catch (error) {
    console.error('[Student Profile] Get error:', error.message);
    res.status(500).json({ message: 'Server error loading student profile' });
  }
});

// @desc    Verify student documents & profile
// @route   PUT /api/students/:id/verify
// @access  Private
router.put('/:id/verify', protect, async (req, res) => {
  const { verificationStatus, verificationRemarks, documents } = req.body;

  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    student.verificationStatus = verificationStatus || student.verificationStatus;
    student.verificationRemarks = verificationRemarks !== undefined ? verificationRemarks : student.verificationRemarks;
    
    if (documents) {
      student.documents = { ...student.documents, ...documents };
    }

    await student.save();
    res.json(mapId(student));
  } catch (error) {
    console.error('[Student Verification] Update error:', error.message);
    res.status(500).json({ message: 'Server error updating verification status' });
  }
});

router.put('/:id/fees', protect, async (req, res) => {
  const { feesPaid, feesAmount, feesReceiptNo, feesPaymentDate, feesPaymentMode, feesInstallment } = req.body;

  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    student.feesPaid = feesPaid !== undefined ? feesPaid : student.feesPaid;
    student.feesAmount = feesAmount !== undefined ? Number(feesAmount) : student.feesAmount;
    student.feesReceiptNo = feesReceiptNo !== undefined ? feesReceiptNo : student.feesReceiptNo;
    student.feesPaymentDate = feesPaymentDate ? new Date(feesPaymentDate) : null;
    student.feesPaymentMode = feesPaymentMode !== undefined ? feesPaymentMode : student.feesPaymentMode;
    student.feesInstallment = feesInstallment !== undefined ? feesInstallment : student.feesInstallment;

    await student.save();

    // Auto-sync to FeePayments table so there is always at least one entry corresponding to the student's current fee fields
    if (student.feesPaid && student.feesReceiptNo) {
      const existing = await FeePayment.findOne({
        where: { studentId: student.id, receiptNo: student.feesReceiptNo }
      });
      
      if (!existing) {
        await FeePayment.create({
          studentId: student.id,
          academicYear: '1st Year',
          semester: 'Annual',
          installmentName: student.feesInstallment || 'Full Payment',
          amountPaid: student.feesAmount || 0.0,
          amountDue: 0.0,
          dueDate: null,
          receiptNo: student.feesReceiptNo,
          paymentDate: student.feesPaymentDate || new Date().toISOString().split('T')[0],
          paymentMode: student.feesPaymentMode || 'Cash',
          remarks: 'Auto-synchronized fee payment'
        });
      }
    }

    // Return student with updated payments list
    const updatedStudent = await Student.findByPk(student.id, {
      include: [{ model: FeePayment, as: 'payments' }]
    });

    const studentObj = mapId(updatedStudent);
    if (studentObj.payments) {
      studentObj.payments = studentObj.payments.map(p => {
        p._id = p.id;
        return p;
      });
    }

    res.json(studentObj);
  } catch (error) {
    console.error('[Student Fees] Update error:', error.message);
    res.status(500).json({ message: 'Server error updating fees payment details' });
  }
});

// @desc    Collect a new fee installment payment
// @route   POST /api/students/:id/fees/collect
// @access  Private
router.post('/:id/fees/collect', protect, async (req, res) => {
  const { 
    academicYear, 
    semester, 
    installmentName, 
    amountPaid, 
    amountDue, 
    dueDate, 
    receiptNo, 
    paymentDate, 
    paymentMode, 
    remarks,
    transactionNo
  } = req.body;

  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // 1. Create a new FeePayment record
    await FeePayment.create({
      studentId: student.id,
      academicYear: academicYear || '1st Year',
      semester: semester || 'Annual',
      installmentName: installmentName || 'Full Payment',
      amountPaid: amountPaid ? Number(amountPaid) : 0.0,
      amountDue: amountDue ? Number(amountDue) : 0.0,
      dueDate: dueDate || null,
      receiptNo,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      paymentMode: paymentMode || 'Cash',
      transactionNo: transactionNo || '',
      remarks: remarks || ''
    });

    // 2. Synchronize latest fee details to the Student record for backward compatibility
    student.feesPaid = true;
    student.feesAmount = Number(amountPaid);
    student.feesReceiptNo = receiptNo;
    student.feesPaymentDate = paymentDate ? new Date(paymentDate) : new Date();
    student.feesPaymentMode = paymentMode;
    student.feesInstallment = installmentName;
    await student.save();

    // 3. Fetch all updated payments and return
    const updatedStudent = await Student.findByPk(student.id, {
      include: [{ model: FeePayment, as: 'payments' }]
    });

    const studentObj = mapId(updatedStudent);
    if (studentObj.payments) {
      studentObj.payments = studentObj.payments.map(p => {
        p._id = p.id;
        return p;
      });
    }

    res.status(201).json(studentObj);
  } catch (error) {
    console.error('[Student Fees Collect] error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error collecting installment payment' });
  }
});

// @desc    Delete a fee payment transaction
// @route   DELETE /api/students/:id/fees/payment/:paymentId
// @access  Private
router.delete('/:id/fees/payment/:paymentId', protect, async (req, res) => {
  try {
    const { id, paymentId } = req.params;
    
    // 1. Find the payment and delete it
    const payment = await FeePayment.findOne({ where: { id: paymentId, studentId: id } });
    if (!payment) {
      return res.status(404).json({ message: 'Fee payment record not found' });
    }
    
    await payment.destroy();
    
    // 2. Recalculate and update core Student fields with the latest remaining payment
    const remainingPayments = await FeePayment.findAll({
      where: { studentId: id },
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']]
    });
    
    const student = await Student.findByPk(id);
    if (student) {
      if (remainingPayments.length > 0) {
        const latest = remainingPayments[0];
        student.feesPaid = true;
        student.feesAmount = latest.amountPaid;
        student.feesReceiptNo = latest.receiptNo;
        student.feesPaymentDate = latest.paymentDate;
        student.feesPaymentMode = latest.paymentMode;
        student.feesInstallment = latest.installmentName;
      } else {
        // No payments left
        student.feesPaid = false;
        student.feesAmount = 0.0;
        student.feesReceiptNo = '';
        student.feesPaymentDate = null;
        student.feesPaymentMode = '';
        student.feesInstallment = '';
      }
      await student.save();
    }
    
    // 3. Return updated student with payments list
    const updatedStudent = await Student.findByPk(id, {
      include: [{ model: FeePayment, as: 'payments' }]
    });
    
    const studentObj = mapId(updatedStudent);
    if (studentObj.payments) {
      studentObj.payments = studentObj.payments.map(p => {
        p._id = p.id;
        return p;
      });
    }
    
    res.json(studentObj);
  } catch (error) {
    console.error('[Student Fees Delete] error:', error.message, error.stack);
    res.status(500).json({ message: 'Server error deleting fee payment record' });
  }
});

// @desc    Upload student document
// @route   PUT /api/students/:id/upload/:docType
// @access  Private
router.put('/:id/upload/:docType', protect, upload.single('file'), async (req, res) => {
  const { id, docType } = req.params;
  const allowedDocTypes = ['photo', 'signature', 'marksheet10', 'marksheet12', 'casteCertificate', 'aadharCard', 'domicileCertificate'];
  
  if (!allowedDocTypes.includes(docType)) {
    return res.status(400).json({ message: 'Invalid document type' });
  }

  try {
    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const docs = student.documents ? (typeof student.documents === 'string' ? JSON.parse(student.documents) : student.documents) : {};
    
    // Delete old file if it exists
    const oldFilename = docs[docType]?.filename;
    if (oldFilename) {
      const oldPath = path.join(__dirname, '..', '..', 'uploads', oldFilename);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error('[Unlink Error]:', e.message);
        }
      }
    }

    // Update document checklist node
    const newDoc = {
      filename: req.file.filename,
      status: 'Pending',
      remarks: ''
    };

    student.documents = {
      ...docs,
      [docType]: newDoc
    };

    await student.save();
    res.json(mapId(student));
  } catch (error) {
    console.error('[Student Doc Upload] error:', error.message);
    res.status(500).json({ message: 'Server error uploading document file' });
  }
});

// @desc    Edit Student Profile Form
// @route   PUT /api/students/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Update form properties dynamically
    const fields = Object.keys(req.body);
    fields.forEach(field => {
      if (field !== 'documents' && field !== '_id' && field !== 'id') {
        student[field] = req.body[field];
      }
    });

    await student.save();
    res.json(mapId(student));
  } catch (error) {
    console.error('[Student Edit] error:', error.message);
    res.status(500).json({ message: 'Server error updating student details' });
  }
});

// @desc    Delete registration record
// @route   DELETE /api/students/:id
// @access  Private
router.get('/delete/:id', protect, async (req, res) => { // fallback route if DELETE is blocked
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Cleanup physical uploaded files
    const docs = student.documents || {};
    Object.keys(docs).forEach(key => {
      const filename = docs[key]?.filename;
      if (filename) {
        const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    await Student.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Student registration records and physical uploads deleted' });
  } catch (error) {
    console.error('[Student Delete] error:', error.message);
    res.status(500).json({ message: 'Server error deleting student records' });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    // Cleanup physical uploaded files
    const docs = student.documents || {};
    Object.keys(docs).forEach(key => {
      const filename = docs[key]?.filename;
      if (filename) {
        const filePath = path.join(__dirname, '..', '..', 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    await Student.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Student registration records and physical uploads deleted' });
  } catch (error) {
    console.error('[Student Delete] error:', error.message);
    res.status(500).json({ message: 'Server error deleting student records' });
  }
});

// @desc    Bulk import students from Excel / CSV
// @route   POST /api/students/bulk-import
// @access  Private
router.post('/bulk-import', protect, async (req, res) => {
  try {
    const { 
      students = [], 
      targetSession, 
      defaultSession = '2025-26', 
      defaultCourse = 'Bachelor of Laws (L.L.B.)',
      defaultYear = '1st Year',
      defaultSemester = 'I & II Semester',
      autoCreateFeePayment = true
    } = req.body;

    const assignedSession = targetSession || defaultSession;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'No student data rows provided for import' });
    }

    const config = await getRegConfig();
    let currentRegNum = config.currentNumber;

    // Get max srNo
    const lastStudent = await Student.findOne({
      attributes: ['srNo'],
      order: [['srNo', 'DESC']]
    });
    let currentSrNo = lastStudent && lastStudent.srNo ? lastStudent.srNo + 1 : 1;

    // Helper to find value from row by multiple potential key aliases
    const getVal = (row, aliases, fallback = '') => {
      for (const alias of aliases) {
        if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== '') {
          return String(row[alias]).trim();
        }
      }
      // Also do a case-insensitive key search
      const rowKeys = Object.keys(row);
      for (const alias of aliases) {
        const lowerAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
        const matchedKey = rowKeys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === lowerAlias);
        if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null && String(row[matchedKey]).trim() !== '') {
          return String(row[matchedKey]).trim();
        }
      }
      return fallback;
    };

    const imported = [];
    const errors = [];
    let paymentsCreated = 0;

    for (let i = 0; i < students.length; i++) {
      const row = students[i];
      const rowNum = i + 1;

      try {
        const fullName = getVal(row, ['fullName', 'Full Name', 'Student Name', 'Candidate Name', 'name', 'Name', 'STUDENT NAME', 'StudentName', 'नाम', 'छात्र का नाम']);
        if (!fullName) {
          errors.push({ row: rowNum, error: 'Student Name is missing in this row' });
          continue;
        }

        const courseApplied = getVal(row, ['courseApplied', 'Course Applied', 'course', 'Course', 'Class', 'Class/Course', 'Branch', 'कक्षा', 'पाठ्यक्रम'], defaultCourse);
        const academicSession = assignedSession || getVal(row, ['academicSession', 'Academic Session', 'session', 'Session', 'Batch', 'सत्र'], defaultSession);
        const academicYear = getVal(row, ['academicYear', 'Academic Year', 'year', 'Year', 'Current Year', 'वर्ष'], defaultYear);
        const semester = getVal(row, ['semester', 'Semester', 'Current Semester', 'Term', 'सेमेस्टर'], defaultSemester);

        let mobileNumber = getVal(row, ['mobileNumber', 'Mobile Number', 'mobile', 'Mobile', 'Mobile No', 'Phone', 'Contact', 'Phone Number', 'MOBILE', 'मोबाइल'], '0000000000');
        // Clean mobile number (keep digits)
        mobileNumber = mobileNumber.replace(/[^0-9]/g, '');
        if (mobileNumber.length < 10) mobileNumber = mobileNumber.padEnd(10, '0');
        if (mobileNumber.length > 10) mobileNumber = mobileNumber.slice(-10);

        let rawEmail = getVal(row, ['email', 'Email', 'Email ID', 'EMAIL']);
        if (!rawEmail || !rawEmail.includes('@')) {
          rawEmail = `student_${Date.now()}_${i}@bjsrampuria.edu.in`;
        }

        // Handle email uniqueness
        const emailExists = await Student.findOne({ where: { email: rawEmail } });
        const cleanEmail = emailExists ? `student_${Date.now()}_${i}_${Math.floor(Math.random()*1000)}@bjsrampuria.edu.in` : rawEmail;

        // Registration ID: use if provided, else auto-generate sequentially
        let registrationId = getVal(row, ['registrationId', 'Registration ID', 'regNo', 'Reg No', 'RegNo', 'Roll No', 'Enrollment No', 'Form No']);
        if (registrationId) {
          const idExists = await Student.findOne({ where: { registrationId } });
          if (idExists) {
            registrationId = formatRegId(currentRegNum++, config, academicSession);
          }
        } else {
          registrationId = formatRegId(currentRegNum++, config, academicSession);
        }

        // Gender Normalization
        let rawGender = getVal(row, ['gender', 'Gender', 'Sex', 'SEX', 'लिंग'], 'Male');
        let gender = 'Male';
        if (/f|female|महिला/i.test(rawGender)) gender = 'Female';
        else if (/trans|other/i.test(rawGender)) gender = 'Other';

        // Category Normalization
        let rawCat = getVal(row, ['category', 'Category', 'Caste', 'Social Category', 'वर्ग'], 'General');
        let category = 'General';
        if (/obc/i.test(rawCat)) category = 'OBC';
        else if (/sc/i.test(rawCat)) category = 'SC';
        else if (/st/i.test(rawCat)) category = 'ST';
        else if (/ews/i.test(rawCat)) category = 'EWS';
        else if (/mbc/i.test(rawCat)) category = 'MBC';

        // Date of Birth
        let dob = getVal(row, ['dateOfBirth', 'DOB', 'Date of Birth', 'Birth Date', 'dob', 'D.O.B', 'जन्म तिथि'], '2004-01-01');
        // If Excel date was parsed as number or DD/MM/YYYY
        if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(dob)) {
          const parts = dob.split(/[\/\-]/);
          const yyyy = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          dob = `${yyyy}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }

        const newStudent = await Student.create({
          srNo: currentSrNo++,
          registrationId,
          fullName,
          fatherName: getVal(row, ['fatherName', "Father's Name", 'Father Name', 'FATHER_NAME', 'FATHER NAME', 'Father', 'पिता का नाम']),
          motherName: getVal(row, ['motherName', "Mother's Name", 'Mother Name', 'MOTHER_NAME', 'MOTHER NAME', 'Mother', 'माता का नाम']),
          mobileNumber,
          alternateMobile: getVal(row, ['alternateMobile', 'Alt Mobile', 'Alternate Mobile', 'Father Mobile', 'Parents Contact']),
          email: cleanEmail,
          gender,
          dateOfBirth: dob,
          address: getVal(row, ['address', 'Address', 'Permanent Address', 'Full Address', 'Village', 'पता']),
          city: getVal(row, ['city', 'City', 'District', 'शहर'], 'Bikaner'),
          state: getVal(row, ['state', 'State', 'राज्य'], 'Rajasthan'),
          pincode: getVal(row, ['pincode', 'Pincode', 'Pin Code', 'Postal Code', 'पिन कोड'], '334001'),
          category,
          courseApplied,
          academicSession,
          academicYear,
          semester,
          admissionBase: getVal(row, ['admissionBase', 'Admission Base', 'Base'], 'UG'),
          formNo: getVal(row, ['formNo', 'Form No', 'FormNo', 'Application No']),
          studentAccNo: getVal(row, ['studentAccNo', 'Student Acc No', 'Account No']),
          medium: getVal(row, ['medium', 'Medium', 'माध्यम'], 'Hindi'),
          permanentAddress: getVal(row, ['permanentAddress', 'Permanent Address', 'address', 'Address']),
          parentsContact: getVal(row, ['parentsContact', 'Parents Contact', 'alternateMobile']),
          whatsAppNo: getVal(row, ['whatsAppNo', 'WhatsApp No', 'WhatsApp', 'mobileNumber']),
          aadharNo: getVal(row, ['aadharNo', 'Aadhar No', 'Aadhaar', 'Aadhar', 'UID', 'आधार नं.']),
          yearlyIncomeFather: getVal(row, ['yearlyIncomeFather', 'Father Income', 'Income']),
          yearlyIncomeMother: getVal(row, ['yearlyIncomeMother', 'Mother Income']),
          
          // Academic 10th
          marks10: getVal(row, ['marks10', '10th %', '10th Marks', '10th Percentage', '10th']),
          board10: getVal(row, ['board10', '10th Board', 'Board 10th', 'RBSE/CBSE'], 'RBSE'),
          passingYear10: getVal(row, ['passingYear10', '10th Year', 'Year 10th']),
          maxMarks10: getVal(row, ['maxMarks10', '10th Max']),
          obtainedMarks10: getVal(row, ['obtainedMarks10', '10th Obtained']),
          
          // Academic 12th
          marks12: getVal(row, ['marks12', '12th %', '12th Marks', '12th Percentage', '12th']),
          board12: getVal(row, ['board12', '12th Board', 'Board 12th'], 'RBSE'),
          passingYear12: getVal(row, ['passingYear12', '12th Year', 'Year 12th']),
          subject12: getVal(row, ['subject12', '12th Subject', 'Stream']),
          maxMarks12: getVal(row, ['maxMarks12', '12th Max']),
          obtainedMarks12: getVal(row, ['obtainedMarks12', '12th Obtained']),

          // Graduation / Qualifying
          gradUniversity: getVal(row, ['gradUniversity', 'Graduation University', 'Grad Univ', 'University']),
          gradYear: getVal(row, ['gradYear', 'Graduation Year', 'Grad Year']),
          gradSubject: getVal(row, ['gradSubject', 'Graduation Subject', 'Grad Subject']),
          gradMaxMarks: getVal(row, ['gradMaxMarks', 'Grad Max']),
          gradObtainedMarks: getVal(row, ['gradObtainedMarks', 'Grad Obtained']),
          gradPercentage: getVal(row, ['gradPercentage', 'Grad %', 'Graduation %', 'Graduation Marks']),

          verificationStatus: 'Approved',
          seatAllotted: true
        });

        // Check if row has fee payment records to auto-link
        const feePaidRaw = getVal(row, ['feesPaid', 'Fees Paid', 'Fee Paid', 'Paid Amount', 'Amount Paid', 'Fee', 'Fees', 'Amount', 'शुल्क']);
        const feeAmount = parseFloat(feePaidRaw);
        if (autoCreateFeePayment && !isNaN(feeAmount) && feeAmount > 0) {
          const receiptNo = getVal(row, ['receiptNo', 'Receipt No', 'Receipt', 'Challan No', 'Bill No'], `REC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${i}`);
          const paymentMode = getVal(row, ['paymentMode', 'Payment Mode', 'Mode', 'Payment Type'], 'Cash');
          const transactionNo = getVal(row, ['transactionNo', 'Transaction No', 'Txn No', 'UTR', 'Cheque No', 'Ref No']);
          const paymentDate = getVal(row, ['paymentDate', 'Payment Date', 'Date'], new Date().toISOString().split('T')[0]);
          const installmentName = getVal(row, ['installmentName', 'Installment', 'Fee Head'], '1st Installment / Admission Fee');

          await FeePayment.create({
            studentId: newStudent.id,
            academicYear: newStudent.academicYear || '1st Year',
            academicSession: newStudent.academicSession || assignedSession,
            semester: newStudent.semester || 'I & II Semester',
            installmentName,
            amountPaid: feeAmount,
            amountDue: 0.0,
            dueDate: null,
            receiptNo,
            paymentDate,
            paymentMode,
            transactionNo,
            remarks: `Imported via Bulk Excel (${row.fullName || 'Student'})`
          });
          paymentsCreated++;
        }

        imported.push(mapId(newStudent));
      } catch (err) {
        errors.push({ row: rowNum, student: row.fullName || `Row ${rowNum}`, error: err.message });
      }
    }

    // Update registration number config counter
    config.currentNumber = currentRegNum;
    const setting = await AppSetting.findOne({ where: { key: 'reg_number_config' } });
    if (setting) {
      await setting.update({ value: JSON.stringify(config) });
    }

    res.json({
      success: true,
      message: `Successfully imported ${imported.length} student(s) into Session ${assignedSession}! ${paymentsCreated > 0 ? `(${paymentsCreated} fee receipt(s) recorded)` : ''}`,
      count: imported.length,
      assignedSession,
      paymentsCreated,
      errorsCount: errors.length,
      errors,
      imported
    });
  } catch (error) {
    console.error('[Bulk Import Students] error:', error.message);
    res.status(500).json({ message: error.message || 'Server error during bulk student import' });
  }
});

// @desc    Get Student 360 Comprehensive Dossier / Complete Master Record
// @route   GET /api/students/:id/360-dossier
// @access  Private
router.get('/:id/360-dossier', protect, async (req, res) => {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student profile not found' });
    }

    const studentData = mapId(student);

    // 1. Fetch all Exam Results
    const results = await Result.findAll({
      where: { studentId: student.id },
      order: [['academicSession', 'DESC'], ['semester', 'DESC'], ['createdAt', 'DESC']]
    });

    // 2. Fetch all Fee Payments
    const feePayments = await FeePayment.findAll({
      where: { studentId: student.id },
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']]
    });

    // Compute fee summary
    let totalPaid = 0;
    let totalDue = 0;
    feePayments.forEach(p => {
      totalPaid += Number(p.amountPaid) || 0;
      if (p.amountDue !== undefined && p.amountDue !== null) {
        totalDue = Number(p.amountDue);
      }
    });

    // 3. Fetch Library Issue/Return history
    const bookIssues = await BookIssue.findAll({
      where: { studentId: student.id },
      include: [{
        model: Book,
        as: 'book',
        attributes: ['bookNo', 'title', 'author', 'shelfLocation']
      }],
      order: [['issueDate', 'DESC']]
    });

    res.json({
      student: studentData,
      results: results.map(mapId),
      feePayments: feePayments.map(mapId),
      feeSummary: {
        totalPaid,
        totalDue,
        hasPaidRecord: feePayments.length > 0,
        isCleared: feePayments.length > 0 && totalDue === 0
      },
      bookIssues: bookIssues.map(mapId),
      documents: student.documents || {}
    });
  } catch (error) {
    console.error('[Student 360 Dossier] error:', error.message);
    res.status(500).json({ message: error.message || 'Error fetching student 360 dossier' });
  }
});

module.exports = router;

