const Admin = require('./models/Admin');
const Course = require('./models/Course');
const Student = require('./models/Student');
const FeePayment = require('./models/FeePayment');
const Expense = require('./models/Expense');
const Book = require('./models/Book');
const BookIssue = require('./models/BookIssue');
const { Op } = require('sequelize');

const seedData = async () => {
  console.log('[Seeding] Starting comprehensive database seed check...');

  try {
    // 1. Seed Admin
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        username: 'admin',
        password: 'admin123',
        name: 'System Administrator',
        role: 'SuperAdmin',
        permissions: '["dashboard","registration","verification","fees","library","reports"]'
      });
      console.log('[Seeding] ✓ Default Admin created (admin / admin123)');
    } else {
      const defaultAdmin = await Admin.findOne({ where: { username: 'admin' } });
      if (defaultAdmin) {
        defaultAdmin.role = 'SuperAdmin';
        defaultAdmin.permissions = '["dashboard","registration","verification","fees","library","reports"]';
        await defaultAdmin.save();
      }
    }

    // 2. Seed Standard Law College Courses with Official Fee Structures
    const courseCount = await Course.count();
    if (courseCount === 0) {
      const courses = [
        {
          name: 'B.A. L.L.B. Integrated',
          code: 'BA-LLB',
          duration: '5 Years',
          totalSeats: 120,
          cutoffMarks: 45,
          schemeType: 'Semester Scheme',
          academicYear: '1st Year',
          semester: 'I & II Semester',
          firstInstallment: 16000,
          firstInstallmentDesc: 'at the time of Admission',
          secondInstallment: 9000,
          secondInstallmentDesc: 'at the time of Exam Form',
          totalFee: 25000,
          cautionMoney: 300,
          provisionalPromotionFee: 300,
          isActive: true
        },
        {
          name: 'Bachelor of Laws (L.L.B.)',
          code: 'LLB',
          duration: '3 Years',
          totalSeats: 240,
          cutoffMarks: 45,
          schemeType: 'Semester Scheme',
          academicYear: '1st Year',
          semester: 'I & II Semester',
          firstInstallment: 16000,
          firstInstallmentDesc: 'at the time of Admission',
          secondInstallment: 9000,
          secondInstallmentDesc: 'at the time of Exam Form of I Semester',
          totalFee: 25000,
          cautionMoney: 300,
          provisionalPromotionFee: 300,
          isActive: true
        },
        {
          name: 'Master of Laws (L.L.M.)',
          code: 'LLM',
          duration: '2 Years',
          totalSeats: 40,
          cutoffMarks: 50,
          schemeType: 'Post Graduate (Part - I)',
          academicYear: '1st Year',
          semester: 'I & II Semester',
          firstInstallment: 16500,
          firstInstallmentDesc: 'First Installment (at Admission)',
          secondInstallment: 8500,
          secondInstallmentDesc: 'Second Installment (at Exam Form)',
          totalFee: 25000,
          cautionMoney: 300,
          provisionalPromotionFee: 300,
          isActive: true
        },
        {
          name: 'PGDCC & PGDLL',
          code: 'PGDCC-PGDLL',
          duration: '1 Year Diploma',
          totalSeats: 60,
          cutoffMarks: 45,
          schemeType: 'Diploma Scheme',
          academicYear: 'Diploma Year',
          semester: 'Annual',
          firstInstallment: 13500,
          firstInstallmentDesc: 'First Installment (at Admission)',
          secondInstallment: 7500,
          secondInstallmentDesc: 'Second Installment (at Exam Form)',
          totalFee: 21000,
          cautionMoney: 300,
          provisionalPromotionFee: 0,
          isActive: true
        }
      ];

      await Course.bulkCreate(courses);
      console.log(`[Seeding] ✓ Seeded ${courses.length} courses with official fee structures.`);
    }

    // 3. Ensure Realistic Law Students Exist
    let students = await Student.findAll();
    if (students.length === 0) {
      console.log('[Seeding] Seeding realistic Law College student profiles...');
      const demoStudents = [
        {
          srNo: 1,
          registrationId: 'REG-2026-1001',
          fullName: 'Rajesh Kumar Sharma',
          fatherName: 'Vijay Kumar Sharma',
          motherName: 'Suman Devi',
          mobileNumber: '9829012345',
          email: 'rajesh.sharma@gmail.com',
          gender: 'Male',
          dateOfBirth: '2004-08-12',
          address: '12, Vyas Colony, Near Fort',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334001',
          category: 'General',
          courseApplied: 'Bachelor of Laws (L.L.B.)',
          currentYear: '1st Year',
          currentSemester: 'I & II Semester',
          academicSession: '2025-26',
          verificationStatus: 'Approved',
          seatAllotted: true,
          admissionBase: 'UG'
        },
        {
          srNo: 2,
          registrationId: 'REG-2026-1002',
          fullName: 'Priya Choudhary',
          fatherName: 'Hargovind Choudhary',
          motherName: 'Kamla Devi',
          mobileNumber: '9414123456',
          email: 'priya.choudhary@gmail.com',
          gender: 'Female',
          dateOfBirth: '2005-03-24',
          address: 'Plot 44, Pawanpuri',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334003',
          category: 'OBC',
          courseApplied: 'B.A. L.L.B. Integrated',
          currentYear: '1st Year',
          currentSemester: 'I & II Semester',
          academicSession: '2025-26',
          verificationStatus: 'Approved',
          seatAllotted: true,
          admissionBase: '12th'
        },
        {
          srNo: 3,
          registrationId: 'REG-2026-1003',
          fullName: 'Amit Kumar Meghwal',
          fatherName: 'Ramesh Meghwal',
          motherName: 'Santosh Devi',
          mobileNumber: '8877665544',
          email: 'amit.meghwal@gmail.com',
          gender: 'Male',
          dateOfBirth: '2003-11-05',
          address: 'Ward No 5, Nokha',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334803',
          category: 'SC',
          courseApplied: 'Bachelor of Laws (L.L.B.)',
          currentYear: '1st Year',
          currentSemester: 'I & II Semester',
          academicSession: '2025-26',
          verificationStatus: 'Approved',
          seatAllotted: true,
          admissionBase: 'UG'
        },
        {
          srNo: 4,
          registrationId: 'REG-2026-1004',
          fullName: 'Neha Vyas',
          fatherName: 'Sushil Vyas',
          motherName: 'Rajni Vyas',
          mobileNumber: '7766554433',
          email: 'neha.vyas@gmail.com',
          gender: 'Female',
          dateOfBirth: '2002-05-18',
          address: 'Sadul Ganj',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334001',
          category: 'General',
          courseApplied: 'Master of Laws (L.L.M.)',
          currentYear: '1st Year',
          currentSemester: 'Part - I',
          academicSession: '2025-26',
          verificationStatus: 'Approved',
          seatAllotted: true,
          admissionBase: 'LLB'
        },
        {
          srNo: 5,
          registrationId: 'REG-2026-1005',
          fullName: 'Vikram Singh Rathore',
          fatherName: 'Surendra Singh Rathore',
          motherName: 'Kanchan Kanwar',
          mobileNumber: '9660123456',
          email: 'vikram.singh@gmail.com',
          gender: 'Male',
          dateOfBirth: '2004-09-30',
          address: 'Karni Nagar',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334004',
          category: 'General',
          courseApplied: 'B.A. L.L.B. Integrated',
          currentYear: '1st Year',
          currentSemester: 'I & II Semester',
          academicSession: '2025-26',
          verificationStatus: 'Approved',
          seatAllotted: true,
          admissionBase: '12th'
        },
        {
          srNo: 6,
          registrationId: 'REG-2026-1006',
          fullName: 'Sunita Meena',
          fatherName: 'Kailash Meena',
          motherName: 'Geeta Devi',
          mobileNumber: '9116234567',
          email: 'sunita.meena@gmail.com',
          gender: 'Female',
          dateOfBirth: '2005-01-15',
          address: 'Ganga Shahar',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334401',
          category: 'ST',
          courseApplied: 'Bachelor of Laws (L.L.B.)',
          currentYear: '1st Year',
          currentSemester: 'I & II Semester',
          academicSession: '2025-26',
          verificationStatus: 'Approved',
          seatAllotted: true,
          admissionBase: 'UG'
        }
      ];

      students = await Student.bulkCreate(demoStudents);
      console.log(`[Seeding] ✓ Seeded ${students.length} demo students.`);
    }

    // 4. Seed Rich Fee Payments (Credits/Inflow)
    const feeCount = await FeePayment.count();
    if (feeCount === 0 && students.length > 0) {
      console.log('[Seeding] Seeding realistic fee payments across multiple dates and payment modes...');
      
      const todayStr = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterdayStr = d.toISOString().split('T')[0];
      d.setDate(d.getDate() - 1);
      const twoDaysAgoStr = d.toISOString().split('T')[0];

      const s1 = students[0];
      const s2 = students[1] || students[0];
      const s3 = students[2] || students[0];
      const s4 = students[3] || students[0];
      const s5 = students[4] || students[0];

      const demoPayments = [
        {
          studentId: s1.id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'I & II Semester',
          installmentName: '1st Installment / Admission Fee',
          amountPaid: 16000.0,
          amountDue: 9000.0,
          dueDate: '2026-11-15',
          receiptNo: 'REC-2026-00101',
          paymentDate: twoDaysAgoStr,
          paymentMode: 'Cash',
          transactionNo: '',
          remarks: 'Admission fee deposited in cash at counter'
        },
        {
          studentId: s2.id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'I & II Semester',
          installmentName: '1st Installment / Admission Fee',
          amountPaid: 16000.0,
          amountDue: 9000.0,
          dueDate: '2026-11-15',
          receiptNo: 'REC-2026-00102',
          paymentDate: yesterdayStr,
          paymentMode: 'UPI',
          transactionNo: 'UPI/627491028472',
          remarks: 'Online admission fee paid via GooglePay QR'
        },
        {
          studentId: s2.id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'I & II Semester',
          installmentName: '2nd Installment / Examination Fee',
          amountPaid: 9000.0,
          amountDue: 0.0,
          dueDate: null,
          receiptNo: 'REC-2026-00103',
          paymentDate: todayStr,
          paymentMode: 'Net Banking',
          transactionNo: 'NEFT/PUNB2026091201',
          remarks: 'Second installment examination fee complete'
        },
        {
          studentId: s3.id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'I & II Semester',
          installmentName: '1st Installment / Admission Fee',
          amountPaid: 16000.0,
          amountDue: 9000.0,
          dueDate: '2026-11-15',
          receiptNo: 'REC-2026-00104',
          paymentDate: todayStr,
          paymentMode: 'Cash',
          transactionNo: '',
          remarks: 'Admission first installment cash deposit'
        },
        {
          studentId: s4.id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'Part - I',
          installmentName: '1st Installment / Admission Fee',
          amountPaid: 16500.0,
          amountDue: 8500.0,
          dueDate: '2026-11-20',
          receiptNo: 'REC-2026-00105',
          paymentDate: yesterdayStr,
          paymentMode: 'Cheque',
          transactionNo: 'CHQ-482019 (SBI)',
          remarks: 'LL.M. Part-I admission fees paid by cheque'
        },
        {
          studentId: s5.id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'I & II Semester',
          installmentName: 'Caution Money (Refundable)',
          amountPaid: 300.0,
          amountDue: 0.0,
          dueDate: null,
          receiptNo: 'REC-2026-00106',
          paymentDate: todayStr,
          paymentMode: 'Cash',
          transactionNo: '',
          remarks: 'Library and college caution deposit'
        }
      ];

      await FeePayment.bulkCreate(demoPayments);
      console.log(`[Seeding] ✓ Seeded ${demoPayments.length} demo fee payment receipts.`);
    }

    // 5. Seed Realistic Expenses (Debits/Outflow)
    const expenseCount = await Expense.count();
    if (expenseCount === 0) {
      console.log('[Seeding] Seeding realistic operational debit vouchers (Expenses)...');
      
      const todayStr = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterdayStr = d.toISOString().split('T')[0];
      d.setDate(d.getDate() - 1);
      const twoDaysAgoStr = d.toISOString().split('T')[0];

      const demoExpenses = [
        {
          voucherNo: 'EXP-2026-0001',
          category: 'Stationery & Printing',
          expenseDate: twoDaysAgoStr,
          paidTo: 'Shyam Stationery Mart, Kote Gate',
          amount: 2450.0,
          paymentMode: 'Cash',
          transactionRef: 'BILL-8942',
          narration: 'Purchased 5 reams of A4 paper, student attendance registers, and office pens.',
          academicSession: '2025-26',
          authorizedBy: 'Accountant',
          status: 'APPROVED'
        },
        {
          voucherNo: 'EXP-2026-0002',
          category: 'Electricity & Utilities',
          expenseDate: yesterdayStr,
          paidTo: 'JVVNL Bikaner Electric Sub-Division',
          amount: 8650.0,
          paymentMode: 'Net Banking',
          transactionRef: 'UTR-9384729104',
          narration: 'Monthly electricity bill payment for college administrative block and classrooms.',
          academicSession: '2025-26',
          authorizedBy: 'SuperAdmin',
          status: 'APPROVED'
        },
        {
          voucherNo: 'EXP-2026-0003',
          category: 'Building & Campus Maintenance',
          expenseDate: yesterdayStr,
          paidTo: 'Ramesh Electricals & Hardware',
          amount: 3200.0,
          paymentMode: 'Cash',
          transactionRef: 'BILL-104',
          narration: 'Replacement of LED tube lights in library reading room and ceiling fan repair.',
          academicSession: '2025-26',
          authorizedBy: 'Accountant',
          status: 'APPROVED'
        },
        {
          voucherNo: 'EXP-2026-0004',
          category: 'Tea & Refreshments / Hospitality',
          expenseDate: todayStr,
          paidTo: 'Jain Canteen & Catering Services',
          amount: 1850.0,
          paymentMode: 'UPI',
          transactionRef: 'UPI/6274928190',
          narration: 'Faculty staff meeting refreshments and guest speaker hospitality.',
          academicSession: '2025-26',
          authorizedBy: 'Accountant',
          status: 'APPROVED'
        },
        {
          voucherNo: 'EXP-2026-0005',
          category: 'Lab & Library Consumables',
          expenseDate: todayStr,
          paidTo: 'Universal Law Publishing Co. Pvt Ltd',
          amount: 12500.0,
          paymentMode: 'Cheque',
          transactionRef: 'CHQ-774921 (PNB)',
          narration: 'Purchased latest editions of Central Bare Acts and AIR Law Journal subscription.',
          academicSession: '2025-26',
          authorizedBy: 'SuperAdmin',
          status: 'APPROVED'
        },
        {
          voucherNo: 'EXP-2026-0006',
          category: 'Staff Welfare & Honorarium',
          expenseDate: todayStr,
          paidTo: 'Adv. Mahendra Purohit (Moot Court Judge)',
          amount: 5000.0,
          paymentMode: 'UPI',
          transactionRef: 'UPI/9384729102',
          narration: 'Honorarium for presiding over intra-college moot court competition 2026.',
          academicSession: '2025-26',
          authorizedBy: 'SuperAdmin',
          status: 'APPROVED'
        },
        {
          voucherNo: 'EXP-2026-0007',
          category: 'Miscellaneous & Petty Cash',
          expenseDate: todayStr,
          paidTo: 'Poonam Courier & Speed Post',
          amount: 680.0,
          paymentMode: 'Cash',
          transactionRef: 'RCPT-449',
          narration: 'Speed post charges for sending student registration dossiers to MGSU University.',
          academicSession: '2025-26',
          authorizedBy: 'Accountant',
          status: 'APPROVED'
        }
      ];

      await Expense.bulkCreate(demoExpenses);
      console.log(`[Seeding] ✓ Seeded ${demoExpenses.length} demo expense debit vouchers.`);
    }

    // 6. Seed Library Books if empty
    const bookCount = await Book.count();
    if (bookCount === 0) {
      const demoBooks = [
        {
          bookId: 'LAW-001',
          title: 'Constitutional Law of India (Vol 1 & 2)',
          author: 'Dr. J. N. Pandey',
          publisher: 'Central Law Agency',
          category: 'Constitutional Law',
          totalCopies: 8,
          availableCopies: 6,
          price: 950.0
        },
        {
          bookId: 'LAW-002',
          title: 'Indian Penal Code, 1860 with Bharatiya Nyaya Sanhita',
          author: 'Ratanlal & Dhirajlal',
          publisher: 'LexisNexis',
          category: 'Criminal Law',
          totalCopies: 10,
          availableCopies: 8,
          price: 1200.0
        },
        {
          bookId: 'LAW-003',
          title: 'Law of Torts and Consumer Protection',
          author: 'Dr. R. K. Bangia',
          publisher: 'Allahabad Law Agency',
          category: 'Civil Law',
          totalCopies: 6,
          availableCopies: 5,
          price: 650.0
        }
      ];

      await Book.bulkCreate(demoBooks);
      console.log(`[Seeding] ✓ Seeded ${demoBooks.length} law library books.`);
    }

    console.log('[Seeding] ✓ Comprehensive database seeding completed successfully!');
  } catch (error) {
    console.error(`[Seeding] Error during database seeding: ${error.message}`, error.stack);
  }
};

module.exports = seedData;
