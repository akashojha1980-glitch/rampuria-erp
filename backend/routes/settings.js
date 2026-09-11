const express = require('express');
const router = express.Router();
const os = require('os');
const { Op } = require('sequelize');
const DocSetting = require('../models/DocSetting');
const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');
const Expense = require('../models/Expense');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Course = require('../models/Course');
const AcademicSession = require('../models/AcademicSession');
const Result = require('../models/Result');
const Admin = require('../models/Admin');
const AppSetting = require('../models/AppSetting');
const { protect } = require('../middleware/auth');

const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// Default Initial Document Checklist (Only Photo & Signature ON by default, others OFF)
const DEFAULT_DOCUMENTS = [
  { key: 'photo', label: 'Passport Size Photograph', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 1 },
  { key: 'signature', label: 'Candidate Signature', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 2 },
  { key: 'marksheet10', label: '10th Secondary Marksheet', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 3 },
  { key: 'marksheet12', label: '12th Sr. Secondary Marksheet', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 4 },
  { key: 'graduationMarksheet', label: 'Graduation / Qualifying Marksheet', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 5 },
  { key: 'casteCertificate', label: 'Caste Certificate (SC/ST/OBC/EWS)', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 6 },
  { key: 'aadharCard', label: 'Aadhar Card / Identity Proof', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 7 },
  { key: 'domicileCertificate', label: 'Domicile / Residence Certificate', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 8 }
];

// Helper: Seed Default Documents if empty
async function seedDefaultDocSettingsIfEmpty() {
  const count = await DocSetting.count();
  if (count === 0) {
    await DocSetting.bulkCreate(DEFAULT_DOCUMENTS);
  }
}

// @desc    Get all document settings (both active and disabled)
// @route   GET /api/settings/documents
// @access  Private
router.get('/documents', protect, async (req, res) => {
  try {
    await seedDefaultDocSettingsIfEmpty();

    const docs = await DocSetting.findAll({
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json(docs.map(mapId));
  } catch (error) {
    console.error('[Doc Settings] Get error:', error.message);
    res.status(500).json({ message: error.message || 'Error fetching document settings' });
  }
});

// @desc    Toggle document enabled / required status
// @route   PUT /api/settings/documents/:key/toggle
// @access  Private
router.put('/documents/:key/toggle', protect, async (req, res) => {
  try {
    const { key } = req.params;
    const { isEnabled, isRequired } = req.body;

    const doc = await DocSetting.findOne({ where: { key } });
    if (!doc) {
      return res.status(404).json({ message: 'Document requirement setting not found' });
    }

    const updates = {};
    if (typeof isEnabled === 'boolean') updates.isEnabled = isEnabled;
    if (typeof isRequired === 'boolean') updates.isRequired = isRequired;

    await doc.update(updates);
    res.json({ message: `Updated ${doc.label} settings successfully`, doc: mapId(doc) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new custom document requirement
// @route   POST /api/settings/documents
// @access  Private
router.post('/documents', protect, async (req, res) => {
  try {
    const { label, isEnabled = true, isRequired = false } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Document label is required (e.g. Transfer Certificate)' });
    }

    const cleanKey = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
    const existing = await DocSetting.findOne({ where: { key: cleanKey } });
    if (existing) {
      return res.status(400).json({ message: 'A document setting with this name already exists' });
    }

    const maxOrder = await DocSetting.max('displayOrder') || 10;

    const newDoc = await DocSetting.create({
      key: cleanKey,
      label: label.trim(),
      isEnabled: Boolean(isEnabled),
      isRequired: Boolean(isRequired),
      isCustom: true,
      displayOrder: maxOrder + 1
    });

    res.status(201).json({ message: `Added custom document requirement "${label}"`, doc: mapId(newDoc) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete custom document requirement
// @route   DELETE /api/settings/documents/:key
// @access  Private
router.delete('/documents/:key', protect, async (req, res) => {
  try {
    const { key } = req.params;
    const doc = await DocSetting.findOne({ where: { key } });
    if (!doc) {
      return res.status(404).json({ message: 'Document setting not found' });
    }

    if (!doc.isCustom) {
      return res.status(400).json({ message: 'Cannot delete core system documents. You can toggle them OFF instead.' });
    }

    await doc.destroy();
    res.json({ message: `Deleted custom document "${doc.label}"` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── REGISTRATION NUMBER SEQUENCE SETTINGS ───
const AppSetting = require('../models/AppSetting');
const Student = require('../models/Student');

const DEFAULT_REG_CONFIG = {
  prefix: 'BJS/',
  suffix: '',
  startNumber: 1001,
  currentNumber: 1001,
  padding: 4,
  includeYear: false,
  includeSession: false
};

// Helper to get or initialize registration config
async function getRegConfig() {
  const setting = await AppSetting.findOne({ where: { key: 'reg_number_config' } });
  if (!setting) {
    await AppSetting.create({
      key: 'reg_number_config',
      value: JSON.stringify(DEFAULT_REG_CONFIG),
      description: 'Registration Number generation format and counter sequence'
    });
    return { ...DEFAULT_REG_CONFIG };
  }
  try {
    return { ...DEFAULT_REG_CONFIG, ...JSON.parse(setting.value) };
  } catch {
    return { ...DEFAULT_REG_CONFIG };
  }
}

// Format a number with prefix/padding
function formatRegId(number, config, session) {
  const padded = String(number).padStart(config.padding || 4, '0');
  let result = config.prefix || '';
  if (config.includeSession && session) {
    result += `${session}/`;
  }
  if (config.includeYear) {
    result += `${new Date().getFullYear()}/`;
  }
  result += padded;
  if (config.suffix) {
    result += config.suffix;
  }
  return result;
}

// @desc    Get Registration Number Settings & Preview
// @route   GET /api/settings/reg-number
// @access  Private
router.get('/reg-number', protect, async (req, res) => {
  try {
    const config = await getRegConfig();
    const nextPreview = formatRegId(config.currentNumber, config, '2025-26');
    const totalStudents = await Student.count();

    res.json({
      config,
      nextPreview,
      totalStudents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update Registration Number Settings
// @route   PUT /api/settings/reg-number
// @access  Private
router.put('/reg-number', protect, async (req, res) => {
  try {
    const { prefix, suffix, startNumber, currentNumber, padding, includeYear, includeSession } = req.body;
    const current = await getRegConfig();

    const updated = {
      prefix: prefix !== undefined ? prefix : current.prefix,
      suffix: suffix !== undefined ? suffix : current.suffix,
      startNumber: startNumber !== undefined ? Number(startNumber) : current.startNumber,
      currentNumber: currentNumber !== undefined ? Number(currentNumber) : current.currentNumber,
      padding: padding !== undefined ? Number(padding) : current.padding,
      includeYear: Boolean(includeYear),
      includeSession: Boolean(includeSession)
    };

    let setting = await AppSetting.findOne({ where: { key: 'reg_number_config' } });
    if (!setting) {
      setting = await AppSetting.create({
        key: 'reg_number_config',
        value: JSON.stringify(updated),
        description: 'Registration Number format settings'
      });
    } else {
      await setting.update({ value: JSON.stringify(updated) });
    }

    res.json({
      message: 'Registration number settings updated successfully',
      config: updated,
      nextPreview: formatRegId(updated.currentNumber, updated, '2025-26')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Renumber existing students sequentially according to custom config
// @route   POST /api/settings/reg-number/renumber-existing
// @access  Private
router.post('/reg-number/renumber-existing', protect, async (req, res) => {
  try {
    const config = await getRegConfig();
    let counter = config.startNumber;

    const students = await Student.findAll({
      order: [['createdAt', 'ASC'], ['id', 'ASC']]
    });

    for (const student of students) {
      const regId = formatRegId(counter, config, student.academicSession);
      await student.update({ registrationId: regId });
      counter++;
    }

    // Save updated currentNumber
    config.currentNumber = counter;
    const setting = await AppSetting.findOne({ where: { key: 'reg_number_config' } });
    if (setting) {
      await setting.update({ value: JSON.stringify(config) });
    }

    res.json({
      message: `Successfully renumbered ${students.length} students with prefix ${config.prefix}`,
      count: students.length,
      nextNumber: counter
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get live system stats and LAN network status
// @route   GET /api/settings/system-status
// @access  Private
router.get('/system-status', protect, async (req, res) => {
  try {
    const studentCount = await Student.count();
    const feeCount = await FeePayment.count();
    const expenseCount = await Expense.count();
    const bookCount = await Book.count();
    const bookIssueCount = await BookIssue.count();
    const courseCount = await Course.count();
    const sessionCount = await AcademicSession.count();
    const adminCount = await Admin.count();

    // Get Local IP addresses for LAN network connection
    const interfaces = os.networkInterfaces();
    const lanIps = [];
    for (const ifName in interfaces) {
      for (const iface of interfaces[ifName]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          lanIps.push({
            interface: ifName,
            address: iface.address
          });
        }
      }
    }

    const port = process.env.PORT || 5000;
    const autoBackupSetting = await AppSetting.findOne({ where: { key: 'auto_backup_config' } });
    const autoBackup = autoBackupSetting ? JSON.parse(autoBackupSetting.value) : { enabled: true, frequency: 'Daily', lastBackup: new Date().toISOString() };

    res.json({
      counts: {
        students: studentCount,
        feePayments: feeCount,
        expenses: expenseCount,
        books: bookCount,
        bookIssues: bookIssueCount,
        courses: courseCount,
        sessions: sessionCount,
        admins: adminCount
      },
      network: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        uptime: Math.round(os.uptime()),
        lanIps,
        port,
        primaryLanUrl: lanIps.length > 0 ? `http://${lanIps[0].address}:${port}` : `http://localhost:${port}`
      },
      autoBackup
    });
  } catch (error) {
    console.error('[System Status] Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Download full database backup snapshot as JSON
// @route   GET /api/settings/backup/download
// @access  Private
router.get('/backup/download', protect, async (req, res) => {
  try {
    const students = await Student.findAll();
    const feePayments = await FeePayment.findAll();
    const expenses = await Expense.findAll();
    const books = await Book.findAll();
    const bookIssues = await BookIssue.findAll();
    const courses = await Course.findAll();
    const sessions = await AcademicSession.findAll();
    const results = await Result.findAll();
    const docSettings = await DocSetting.findAll();
    const appSettings = await AppSetting.findAll();

    const backupData = {
      meta: {
        app: 'B.J.S. Rampuria Jain Law College ERP',
        version: '2.5.0',
        exportedAt: new Date().toISOString(),
        exportedBy: req.admin?.email || 'SuperAdmin',
        counts: {
          students: students.length,
          feePayments: feePayments.length,
          expenses: expenses.length,
          books: books.length,
          bookIssues: bookIssues.length,
          courses: courses.length,
          sessions: sessions.length,
          results: results.length
        }
      },
      data: {
        students,
        feePayments,
        expenses,
        books,
        bookIssues,
        courses,
        sessions,
        results,
        docSettings,
        appSettings
      }
    };

    const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `rampuria_erp_backup_${dateStr}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (error) {
    console.error('[Backup Download] Error:', error);
    res.status(500).json({ message: 'Error generating database backup: ' + error.message });
  }
});

// @desc    Restore database from JSON backup snapshot
// @route   POST /api/settings/backup/restore
// @access  Private
router.post('/backup/restore', protect, async (req, res) => {
  try {
    const { backupData } = req.body;
    if (!backupData || !backupData.data) {
      return res.status(400).json({ message: 'Invalid backup file format' });
    }

    const { data } = backupData;
    let restoredCounts = {};

    if (Array.isArray(data.students) && data.students.length > 0) {
      for (const st of data.students) {
        const plain = typeof st.get === 'function' ? st.get({ plain: true }) : st;
        const exists = await Student.findByPk(plain.id);
        if (exists) {
          await exists.update(plain);
        } else {
          await Student.create(plain);
        }
      }
      restoredCounts.students = data.students.length;
    }

    if (Array.isArray(data.feePayments) && data.feePayments.length > 0) {
      for (const fp of data.feePayments) {
        const plain = typeof fp.get === 'function' ? fp.get({ plain: true }) : fp;
        const exists = await FeePayment.findByPk(plain.id);
        if (exists) {
          await exists.update(plain);
        } else {
          await FeePayment.create(plain);
        }
      }
      restoredCounts.feePayments = data.feePayments.length;
    }

    if (Array.isArray(data.expenses) && data.expenses.length > 0) {
      for (const exp of data.expenses) {
        const plain = typeof exp.get === 'function' ? exp.get({ plain: true }) : exp;
        const exists = await Expense.findByPk(plain.id);
        if (exists) {
          await exists.update(plain);
        } else {
          await Expense.create(plain);
        }
      }
      restoredCounts.expenses = data.expenses.length;
    }

    if (Array.isArray(data.books) && data.books.length > 0) {
      for (const bk of data.books) {
        const plain = typeof bk.get === 'function' ? bk.get({ plain: true }) : bk;
        const exists = await Book.findByPk(plain.id);
        if (exists) {
          await exists.update(plain);
        } else {
          await Book.create(plain);
        }
      }
      restoredCounts.books = data.books.length;
    }

    if (Array.isArray(data.courses) && data.courses.length > 0) {
      for (const cr of data.courses) {
        const plain = typeof cr.get === 'function' ? cr.get({ plain: true }) : cr;
        const exists = await Course.findByPk(plain.id);
        if (exists) {
          await exists.update(plain);
        } else {
          await Course.create(plain);
        }
      }
      restoredCounts.courses = data.courses.length;
    }

    if (Array.isArray(data.sessions) && data.sessions.length > 0) {
      for (const ses of data.sessions) {
        const plain = typeof ses.get === 'function' ? ses.get({ plain: true }) : ses;
        const exists = await AcademicSession.findOne({ where: { sessionName: plain.sessionName } });
        if (!exists) {
          await AcademicSession.create(plain);
        }
      }
      restoredCounts.sessions = data.sessions.length;
    }

    res.json({
      message: 'Database backup restored successfully',
      restoredCounts
    });
  } catch (error) {
    console.error('[Backup Restore] Error:', error);
    res.status(500).json({ message: 'Error restoring backup: ' + error.message });
  }
});

// @desc    Clear Dummy / Demo Test records only
// @route   POST /api/settings/reset/demo-data
// @access  Private
router.post('/reset/demo-data', protect, async (req, res) => {
  try {
    const demoStudents = await Student.findAll({
      where: {
        [Op.or]: [
          { email: { [Op.like]: '%@example.com%' } },
          { email: { [Op.like]: '%@test.com%' } },
          { fullName: { [Op.like]: 'Demo %' } },
          { fullName: { [Op.like]: 'Test %' } },
          { fullName: { [Op.like]: 'Dummy %' } },
          { fullName: { [Op.in]: ['Aakash Sharma', 'Priya Choudhary', 'Rahul Verma', 'Sneha Patel', 'Amit Kumar', 'Pooja Singh', 'Vikram Rathore', 'Ananya Gupta', 'Deepak Joshi', 'Neha Sharma', 'Rohan Meena', 'Kavita Bishnoi'] } }
        ]
      }
    });

    const demoIds = demoStudents.map(s => s.id);
    if (demoIds.length > 0) {
      await FeePayment.destroy({ where: { studentId: { [Op.in]: demoIds } } });
      await Result.destroy({ where: { studentId: { [Op.in]: demoIds } } });
      await BookIssue.destroy({ where: { studentId: { [Op.in]: demoIds } } });
      await Student.destroy({ where: { id: { [Op.in]: demoIds } } });
    }

    const deletedExpenses = await Expense.destroy({
      where: {
        [Op.or]: [
          { voucherNo: { [Op.like]: '%DEMO%' } },
          { remarks: { [Op.like]: '%Demo%' } },
          { remarks: { [Op.like]: '%Sample%' } }
        ]
      }
    });

    res.json({
      message: `Cleared ${demoStudents.length} demo student(s) and ${deletedExpenses} demo expense record(s). Real student list is intact.`,
      clearedStudents: demoStudents.length,
      clearedExpenses: deletedExpenses
    });
  } catch (error) {
    console.error('[Reset Demo Data] Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @desc    Erase all students and related fees & results
// @route   POST /api/settings/reset/students
// @access  Private
router.post('/reset/students', protect, async (req, res) => {
  try {
    const { confirmationCode } = req.body;
    if (confirmationCode !== 'ERASE_ALL_STUDENTS') {
      return res.status(400).json({ message: 'Invalid confirmation code. Please type "ERASE_ALL_STUDENTS"' });
    }

    const studentCount = await Student.count();
    await FeePayment.destroy({ where: {} });
    await Result.destroy({ where: {} });
    await BookIssue.destroy({ where: {} });
    await Student.destroy({ where: {} });

    res.json({
      message: `Successfully erased all ${studentCount} student registry records, fee payments, and results.`,
      erasedCount: studentCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reset Financial Books (Fee Receipts + Expenses / Day Book)
// @route   POST /api/settings/reset/financials
// @access  Private
router.post('/reset/financials', protect, async (req, res) => {
  try {
    const { confirmationCode } = req.body;
    if (confirmationCode !== 'RESET_FINANCIALS') {
      return res.status(400).json({ message: 'Invalid confirmation code. Please type "RESET_FINANCIALS"' });
    }

    const feeCount = await FeePayment.count();
    const expCount = await Expense.count();

    await FeePayment.destroy({ where: {} });
    await Expense.destroy({ where: {} });

    res.json({
      message: `Financial Books Reset: Erased ${feeCount} fee payments and ${expCount} expense vouchers. Day Book is now fresh.`,
      erasedFees: feeCount,
      erasedExpenses: expCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Factory Reset (Full Data Wipe)
// @route   POST /api/settings/reset/factory
// @access  Private
router.post('/reset/factory', protect, async (req, res) => {
  try {
    const { confirmationCode } = req.body;
    if (confirmationCode !== 'FACTORY_RESET') {
      return res.status(400).json({ message: 'Invalid confirmation code. Please type "FACTORY_RESET"' });
    }

    await FeePayment.destroy({ where: {} });
    await Expense.destroy({ where: {} });
    await Result.destroy({ where: {} });
    await BookIssue.destroy({ where: {} });
    await Student.destroy({ where: {} });
    await Book.destroy({ where: {} });

    res.json({
      message: 'Factory Reset Complete: System has been restored to clean state. SuperAdmin account is preserved.'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update Auto Backup Configuration
// @route   PUT /api/settings/auto-backup
// @access  Private
router.put('/auto-backup', protect, async (req, res) => {
  try {
    const { enabled, frequency } = req.body;
    const config = {
      enabled: Boolean(enabled),
      frequency: frequency || 'Daily',
      updatedAt: new Date().toISOString()
    };

    let setting = await AppSetting.findOne({ where: { key: 'auto_backup_config' } });
    if (!setting) {
      setting = await AppSetting.create({
        key: 'auto_backup_config',
        value: JSON.stringify(config),
        description: 'Auto Backup Configuration'
      });
    } else {
      await setting.update({ value: JSON.stringify(config) });
    }

    res.json({ message: 'Auto backup schedule updated successfully', config });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.getRegConfig = getRegConfig;
module.exports.formatRegId = formatRegId;


