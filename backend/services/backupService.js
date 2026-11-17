const path = require('path');
const fs = require('fs');
const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');
const Expense = require('../models/Expense');
const Book = require('../models/Book');
const BookIssue = require('../models/BookIssue');
const Course = require('../models/Course');
const AcademicSession = require('../models/AcademicSession');
const DocSetting = require('../models/DocSetting');
const AppSetting = require('../models/AppSetting');
const Result = require('../models/Result');

// Determine backup directory (next to executable in packaged mode, or in project root in dev)
const getBackupDirectory = () => {
  const isPackaged = typeof process.pkg !== 'undefined';
  const baseDir = isPackaged 
    ? path.dirname(process.execPath) 
    : path.resolve(__dirname, '..', '..');
  
  const backupDir = path.join(baseDir, 'backups');
  if (!fs.existsSync(backupDir)) {
    try {
      fs.mkdirSync(backupDir, { recursive: true });
      console.log(`[Backup Service] Created local backups folder at: ${backupDir}`);
    } catch (err) {
      console.error(`[Backup Service] Error creating backups folder:`, err.message);
    }
  }
  return backupDir;
};

// Format bytes into readable string (e.g. 450 KB, 1.2 MB)
const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Generate a complete database snapshot and save directly into the backups/ folder
 * @param {Object} options { type: 'manual' | 'auto_24h', triggeredBy: string }
 */
const createLocalBackup = async ({ type = 'manual', triggeredBy = 'User' } = {}) => {
  const backupDir = getBackupDirectory();

  // Fetch all entities across all modules
  const [
    students,
    feePayments,
    expenses,
    books,
    bookIssues,
    courses,
    sessions,
    docSettings,
    appSettings,
    results
  ] = await Promise.all([
    Student.findAll(),
    FeePayment.findAll(),
    Expense.findAll(),
    Book.findAll(),
    BookIssue.findAll(),
    Course.findAll(),
    AcademicSession.findAll(),
    DocSetting.findAll(),
    AppSetting.findAll(),
    Result.findAll()
  ]);

  const now = new Date();
  // Safe filename timestamp: YYYY-MM-DD_HH-mm-ss
  const pad = (n) => String(n).padStart(2, '0');
  const timestampStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
  
  const prefix = type === 'auto_24h' ? 'Auto_Backup_24h' : 'Manual_Backup';
  const filename = `${prefix}_${timestampStr}.json`;
  const filepath = path.join(backupDir, filename);

  const backupData = {
    meta: {
      app: 'B.J.S. Rampuria Jain Law College ERP',
      version: '2.5.0',
      type, // 'manual' | 'auto_24h'
      exportedAt: now.toISOString(),
      triggeredBy,
      folderPath: backupDir,
      counts: {
        students: students.length,
        feePayments: feePayments.length,
        expenses: expenses.length,
        books: books.length,
        bookIssues: bookIssues.length,
        courses: courses.length,
        sessions: sessions.length,
        docSettings: docSettings.length,
        appSettings: appSettings.length,
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
      docSettings,
      appSettings,
      results
    }
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  fs.writeFileSync(filepath, jsonString, 'utf8');
  const stats = fs.statSync(filepath);

  console.log(`[Backup Service] ✅ Saved ${type} backup (${formatBytes(stats.size)}) to: ${filename}`);

  // Record last backup timestamp in AppSetting table for diagnostics
  try {
    let setting = await AppSetting.findOne({ where: { key: 'last_local_backup_info' } });
    const infoPayload = JSON.stringify({
      filename,
      timestamp: now.toISOString(),
      type,
      size: stats.size,
      counts: backupData.meta.counts
    });
    if (setting) {
      await setting.update({ value: infoPayload });
    } else {
      await AppSetting.create({
        key: 'last_local_backup_info',
        value: infoPayload,
        description: 'Metadata of the most recent local ERP backup'
      });
    }
  } catch (err) {
    console.warn('[Backup Service] Note: Could not update last_local_backup_info in DB:', err.message);
  }

  return {
    filename,
    filepath,
    folderPath: backupDir,
    size: stats.size,
    sizeFormatted: formatBytes(stats.size),
    meta: backupData.meta
  };
};

/**
 * Scan the backups/ folder and return all backup snapshots with their metadata
 */
const listLocalBackups = async () => {
  const backupDir = getBackupDirectory();
  if (!fs.existsSync(backupDir)) return [];

  const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  const backupList = [];

  for (const filename of files) {
    const fullPath = path.join(backupDir, filename);
    try {
      const stats = fs.statSync(fullPath);
      
      // Parse file meta (read beginning of file or whole JSON)
      let meta = null;
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        const parsed = JSON.parse(content);
        meta = parsed.meta || null;
      } catch (parseErr) {
        // Fallback meta if file parsing fails
        meta = {
          app: 'B.J.S. Rampuria Jain Law College ERP',
          type: filename.toLowerCase().includes('auto') ? 'auto_24h' : 'manual',
          exportedAt: stats.mtime.toISOString(),
          counts: {}
        };
      }

      backupList.push({
        filename,
        filepath: fullPath,
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        createdAt: stats.birthtime || stats.mtime,
        modifiedAt: stats.mtime,
        timestamp: meta?.exportedAt || stats.mtime.toISOString(),
        type: meta?.type || (filename.toLowerCase().includes('auto') ? 'auto_24h' : 'manual'),
        triggeredBy: meta?.triggeredBy || (filename.toLowerCase().includes('auto') ? '24-Hour Standing Timer' : 'SuperAdmin'),
        counts: meta?.counts || {}
      });
    } catch (err) {
      console.warn(`[Backup Service] Error reading backup file ${filename}:`, err.message);
    }
  }

  // Sort descending by timestamp / modifiedAt (latest first)
  backupList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return backupList;
};

/**
 * Restore complete database snapshot from a backup file in backups/ folder
 * @param {string} rawFilename 
 */
const restoreLocalBackup = async (rawFilename) => {
  if (!rawFilename) {
    throw new Error('Backup filename is required');
  }

  // Prevent directory traversal attacks
  const safeFilename = path.basename(rawFilename);
  const backupDir = getBackupDirectory();
  const filepath = path.join(backupDir, safeFilename);

  if (!fs.existsSync(filepath)) {
    throw new Error(`Backup file "${safeFilename}" does not exist in local backups repository.`);
  }

  const content = fs.readFileSync(filepath, 'utf8');
  const backupData = JSON.parse(content);

  if (!backupData || !backupData.data) {
    throw new Error('Invalid backup file structure: missing data payload.');
  }

  const { data } = backupData;
  const restoredCounts = {};

  // 1. Students (Full student profile, academic marks, qualifications, fees snapshot)
  if (Array.isArray(data.students) && data.students.length > 0) {
    let count = 0;
    for (const st of data.students) {
      const plain = typeof st.get === 'function' ? st.get({ plain: true }) : st;
      // Find by PK, registrationId, or studentAccNo
      let existing = null;
      if (plain.id) {
        existing = await Student.findByPk(plain.id);
      }
      if (!existing && plain.registrationId) {
        existing = await Student.findOne({ where: { registrationId: plain.registrationId } });
      }
      if (!existing && plain.studentAccNo) {
        existing = await Student.findOne({ where: { studentAccNo: plain.studentAccNo } });
      }

      if (existing) {
        await existing.update(plain);
      } else {
        await Student.create(plain);
      }
      count++;
    }
    restoredCounts.students = count;
  }

  // 2. Fee Payments & Cash Receipts
  if (Array.isArray(data.feePayments) && data.feePayments.length > 0) {
    let count = 0;
    for (const fp of data.feePayments) {
      const plain = typeof fp.get === 'function' ? fp.get({ plain: true }) : fp;
      let existing = null;
      if (plain.id) existing = await FeePayment.findByPk(plain.id);
      if (!existing && plain.receiptNo) existing = await FeePayment.findOne({ where: { receiptNo: plain.receiptNo } });

      if (existing) {
        await existing.update(plain);
      } else {
        await FeePayment.create(plain);
      }
      count++;
    }
    restoredCounts.feePayments = count;
  }

  // 3. Day Book Expenses & Vouchers
  if (Array.isArray(data.expenses) && data.expenses.length > 0) {
    let count = 0;
    for (const exp of data.expenses) {
      const plain = typeof exp.get === 'function' ? exp.get({ plain: true }) : exp;
      let existing = null;
      if (plain.id) existing = await Expense.findByPk(plain.id);
      if (!existing && plain.voucherNo) existing = await Expense.findOne({ where: { voucherNo: plain.voucherNo } });

      if (existing) {
        await existing.update(plain);
      } else {
        await Expense.create(plain);
      }
      count++;
    }
    restoredCounts.expenses = count;
  }

  // 4. Library Books
  if (Array.isArray(data.books) && data.books.length > 0) {
    let count = 0;
    for (const bk of data.books) {
      const plain = typeof bk.get === 'function' ? bk.get({ plain: true }) : bk;
      let existing = null;
      if (plain.id) existing = await Book.findByPk(plain.id);
      if (!existing && plain.accessionNumber) existing = await Book.findOne({ where: { accessionNumber: plain.accessionNumber } });
      if (!existing && plain.barcode) existing = await Book.findOne({ where: { barcode: plain.barcode } });

      if (existing) {
        await existing.update(plain);
      } else {
        await Book.create(plain);
      }
      count++;
    }
    restoredCounts.books = count;
  }

  // 5. Library Book Issue Loans
  if (Array.isArray(data.bookIssues) && data.bookIssues.length > 0) {
    let count = 0;
    for (const bi of data.bookIssues) {
      const plain = typeof bi.get === 'function' ? bi.get({ plain: true }) : bi;
      let existing = null;
      if (plain.id) existing = await BookIssue.findByPk(plain.id);

      if (existing) {
        await existing.update(plain);
      } else {
        await BookIssue.create(plain);
      }
      count++;
    }
    restoredCounts.bookIssues = count;
  }

  // 6. Courses & Fee Structures
  if (Array.isArray(data.courses) && data.courses.length > 0) {
    let count = 0;
    for (const cr of data.courses) {
      const plain = typeof cr.get === 'function' ? cr.get({ plain: true }) : cr;
      let existing = null;
      if (plain.id) existing = await Course.findByPk(plain.id);
      if (!existing && plain.courseName) existing = await Course.findOne({ where: { courseName: plain.courseName } });

      if (existing) {
        await existing.update(plain);
      } else {
        await Course.create(plain);
      }
      count++;
    }
    restoredCounts.courses = count;
  }

  // 7. Academic Sessions
  if (Array.isArray(data.sessions) && data.sessions.length > 0) {
    let count = 0;
    for (const ses of data.sessions) {
      const plain = typeof ses.get === 'function' ? ses.get({ plain: true }) : ses;
      let existing = null;
      if (plain.id) existing = await AcademicSession.findByPk(plain.id);
      if (!existing && plain.sessionName) existing = await AcademicSession.findOne({ where: { sessionName: plain.sessionName } });

      if (existing) {
        await existing.update(plain);
      } else {
        await AcademicSession.create(plain);
      }
      count++;
    }
    restoredCounts.sessions = count;
  }

  // 8. Document Settings Checklist
  if (Array.isArray(data.docSettings) && data.docSettings.length > 0) {
    let count = 0;
    for (const doc of data.docSettings) {
      const plain = typeof doc.get === 'function' ? doc.get({ plain: true }) : doc;
      if (plain.key) {
        const existing = await DocSetting.findOne({ where: { key: plain.key } });
        if (existing) {
          await existing.update(plain);
        } else {
          await DocSetting.create(plain);
        }
        count++;
      }
    }
    restoredCounts.docSettings = count;
  }

  // 9. App & ERP System Settings
  if (Array.isArray(data.appSettings) && data.appSettings.length > 0) {
    let count = 0;
    for (const appSet of data.appSettings) {
      const plain = typeof appSet.get === 'function' ? appSet.get({ plain: true }) : appSet;
      if (plain.key) {
        const existing = await AppSetting.findOne({ where: { key: plain.key } });
        if (existing) {
          await existing.update(plain);
        } else {
          await AppSetting.create(plain);
        }
        count++;
      }
    }
    restoredCounts.appSettings = count;
  }

  // 10. Exam Results
  if (Array.isArray(data.results) && data.results.length > 0) {
    let count = 0;
    for (const resItem of data.results) {
      const plain = typeof resItem.get === 'function' ? resItem.get({ plain: true }) : resItem;
      let existing = null;
      if (plain.id) existing = await Result.findByPk(plain.id);
      if (existing) {
        await existing.update(plain);
      } else {
        await Result.create(plain);
      }
      count++;
    }
    restoredCounts.results = count;
  }

  console.log(`[Backup Service] ✅ Successfully restored backup "${safeFilename}":`, restoredCounts);

  return {
    filename: safeFilename,
    restoredCounts,
    meta: backupData.meta || {}
  };
};

/**
 * Initializes standing background automated 24-hour backup service
 */
let autoBackupInterval = null;

const initAutoBackupSchedule = () => {
  // Ensure folder exists immediately on startup
  getBackupDirectory();

  const checkAndRunAutoBackup = async () => {
    try {
      // Check last backup timestamp
      const backups = await listLocalBackups();
      const lastBackup = backups[0]; // newest
      
      const now = Date.now();
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

      let shouldBackup = false;
      if (!lastBackup) {
        // No backups exist at all -> create initial snapshot immediately
        shouldBackup = true;
      } else {
        const lastTime = new Date(lastBackup.timestamp).getTime();
        if (now - lastTime >= TWENTY_FOUR_HOURS) {
          shouldBackup = true;
        }
      }

      if (shouldBackup) {
        console.log('[Auto-Backup Engine] 24-Hour window reached. Initiating automatic snapshot...');
        await createLocalBackup({ type: 'auto_24h', triggeredBy: 'Automatic 24-Hour Timer' });
      }
    } catch (err) {
      console.error('[Auto-Backup Engine] Execution error:', err.message);
    }
  };

  // Run initial check 10 seconds after server startup (once DB is synchronized)
  setTimeout(() => {
    checkAndRunAutoBackup();
  }, 10000);

  // Set recurring check every 1 hour
  if (autoBackupInterval) clearInterval(autoBackupInterval);
  autoBackupInterval = setInterval(checkAndRunAutoBackup, 60 * 60 * 1000);
  console.log('[Auto-Backup Engine] Standing 24-hour recurring backup scheduler active.');
};

module.exports = {
  getBackupDirectory,
  createLocalBackup,
  listLocalBackups,
  restoreLocalBackup,
  initAutoBackupSchedule
};
