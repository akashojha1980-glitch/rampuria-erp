const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Connect to local MS SQL Server
console.log('[Migration] Connecting to local MS SQL Server...');
const sequelize = new Sequelize('admission_db', 'sa', 'BjsRampuria@2026', {
  host: '127.0.0.1',
  port: 1433,
  dialect: 'mssql',
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
      cryptoCredentialsDetails: {
        minVersion: 'TLSv1'
      }
    }
  },
  logging: false
});

// Import models
const Admin = require('./models/Admin');
const Course = require('./models/Course');
const Student = require('./models/Student');
const FeePayment = require('./models/FeePayment');
const Book = require('./models/Book');
const BookIssue = require('./models/BookIssue');

async function dump() {
  try {
    await sequelize.authenticate();
    console.log('[Migration] Connected to SQL Server successfully. Querying tables...');

    // Fetch all data
    const courses = await Course.findAll({ raw: true });
    console.log(`[Migration] Found ${courses.length} courses.`);

    const students = await Student.findAll({ raw: true });
    console.log(`[Migration] Found ${students.length} students.`);

    const feePayments = await FeePayment.findAll({ raw: true });
    console.log(`[Migration] Found ${feePayments.length} fee payments.`);

    const books = await Book.findAll({ raw: true });
    console.log(`[Migration] Found ${books.length} books.`);

    const bookIssues = await BookIssue.findAll({ raw: true });
    console.log(`[Migration] Found ${bookIssues.length} book issues.`);

    const admins = await Admin.findAll({ raw: true });
    console.log(`[Migration] Found ${admins.length} admins.`);

    const dataDump = {
      courses,
      students,
      feePayments,
      books,
      bookIssues,
      admins
    };

    const targetFolder = path.join(__dirname, 'database');
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const dumpPath = path.join(targetFolder, 'migrated_data.json');
    fs.writeFileSync(dumpPath, JSON.stringify(dataDump, null, 2), 'utf8');
    console.log(`[Migration] Success! Data exported to ${dumpPath}`);
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Failed to dump local data:', error.message);
    process.exit(1);
  }
}

dump();
