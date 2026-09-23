const Admin = require('./models/Admin');
const Course = require('./models/Course');
const Student = require('./models/Student');
const FeePayment = require('./models/FeePayment');
const Expense = require('./models/Expense');
const Book = require('./models/Book');
const BookIssue = require('./models/BookIssue');
const Result = require('./models/Result');
const AcademicSession = require('./models/AcademicSession');
const DocSetting = require('./models/DocSetting');
const AppSetting = require('./models/AppSetting');
const SuperAdmin = require('./models/SuperAdmin');
const TenantCollege = require('./models/TenantCollege');
const TenantLicense = require('./models/TenantLicense');
const { Op } = require('sequelize');

const seedData = async (force = false) => {
  console.log(`[Seeding] Starting comprehensive ERP seed check (force = ${force})...`);

  try {
    // 0. Seed Master Super Admin (Software Owner)
    const superAdminCount = await SuperAdmin.count();
    if (superAdminCount === 0 || force) {
      const superAdminData = {
        username: 'superadmin',
        password: 'SuperAdmin@2026',
        name: 'Enterprise Master Admin',
        email: 'provider@collegeerp.com',
        phone: '+91 98765 43210',
        securityQuestion: 'What is your software company master key code?',
        securityAnswer: 'ERP2026MASTER',
        role: 'MasterSuperAdmin',
        isActive: true
      };
      const existingSuper = await SuperAdmin.findOne({ where: { username: 'superadmin' } });
      if (!existingSuper) {
        await SuperAdmin.create(superAdminData);
        console.log('[Seeding] ✓ Master Super Admin created (superadmin / SuperAdmin@2026)');
      }
    }

    // 0.1 Seed Default Registered Tenant College (BJS Rampuria Law College)
    const collegeCount = await TenantCollege.count();
    if (collegeCount === 0 || force) {
      let defaultCollege = await TenantCollege.findOne({ where: { collegeCode: 'BJS-01' } });
      if (!defaultCollege) {
        defaultCollege = await TenantCollege.create({
          clientId: 'CLI-2026-001',
          collegeCode: 'BJS-01',
          collegeName: 'B.J.S. Rampuria Jain Law College',
          productType: 'College ERP',
          address: 'Vyapar Mandal Path, Near Rampuria Haveli',
          city: 'Bikaner',
          state: 'Rajasthan',
          mobileNumber: '0151-2200123',
          email: 'info@rampurialaw.ac.in',
          website: 'https://rampurialawcollege.ac.in',
          principalName: 'Dr. Principal Office',
          principalMobile: '+91 98290 12345',
          principalEmail: 'principal@rampurialaw.ac.in',
          installationDate: '2026-01-01',
          packageType: 'Premium',
          status: 'Active',
          licenseKey: 'RAMP-7B9A-4C2E-8F1D-2026',
          licenseStartDate: '2026-01-01',
          licenseExpiryDate: '2027-12-31',
          dbServer: '127.0.0.1',
          dbPort: 1433,
          dbName: 'admission_db',
          dbUsername: 'sa',
          dbPasswordEncrypted: 'BjsRampuria@2026',
          installedModules: JSON.stringify([
            'admission', 'registration', 'verification', 'fees', 
            'examination', 'results', 'promotion', 'library', 
            'staff', 'reports', 'id_card', 'accounts'
          ]),
          amcAmount: 25000,
          totalPaid: 75000,
          notes: 'Flagship Law College Installation'
        });

        await TenantLicense.create({
          tenantId: defaultCollege.id,
          collegeCode: 'BJS-01',
          collegeName: 'B.J.S. Rampuria Jain Law College',
          licenseKey: 'RAMP-7B9A-4C2E-8F1D-2026',
          actionType: 'Initial',
          packageType: 'Premium',
          prevExpiryDate: null,
          newExpiryDate: '2027-12-31',
          amount: 75000,
          invoiceNo: 'INV-100001',
          performedBy: 'System Auto-Seed',
          notes: 'Initial production system onboarding'
        });

        console.log('[Seeding] ✓ Default Tenant College seeded (B.J.S. Rampuria Jain Law College)');
      }
    }

    // 1. Seed Admin
    const adminCount = await Admin.count();
    if (adminCount === 0 || force) {
      let defaultAdmin = await Admin.findOne({ where: { username: 'admin' } });
      if (!defaultAdmin) {
        await Admin.create({
          username: 'admin',
          password: 'admin123',
          name: 'System Administrator',
          role: 'SuperAdmin',
          permissions: '["dashboard","registration","verification","fees","library","reports","results","settings","allotment"]'
        });
        console.log('[Seeding] ✓ Default Admin created (admin / admin123)');
      } else {
        defaultAdmin.role = 'SuperAdmin';
        defaultAdmin.permissions = '["dashboard","registration","verification","fees","library","reports","results","settings","allotment"]';
        await defaultAdmin.save();
      }
    }

    // 2. Seed Academic Sessions
    const sessionCount = await AcademicSession.count();
    if (sessionCount === 0 || force) {
      const sessions = [
        { sessionName: '2025-26', isActive: true, startDate: '2025-07-01', endDate: '2026-06-30' },
        { sessionName: '2024-25', isActive: false, startDate: '2024-07-01', endDate: '2025-06-30' },
        { sessionName: '2026-27', isActive: false, startDate: '2026-07-01', endDate: '2027-06-30' }
      ];
      for (const s of sessions) {
        const exist = await AcademicSession.findOne({ where: { sessionName: s.sessionName } });
        if (!exist) await AcademicSession.create(s);
      }
      console.log('[Seeding] ✓ Academic Sessions seeded (2025-26 active).');
    }

    // 3. Seed Standard Law College Courses with Official Fee Structures
    const courseCount = await Course.count();
    if (courseCount === 0 || force) {
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

      for (const c of courses) {
        const exist = await Course.findOne({ where: { name: c.name } });
        if (!exist) {
          await Course.create(c);
        }
      }
      console.log('[Seeding] ✓ Seeded Law College courses with fee structures.');
    }

    // 4. Seed 10 Realistic Law Students (Comprehensive Profiles)
    const existingStudentCount = await Student.count();
    const tenDemoStudents = [
      {
        srNo: 1,
        registrationId: 'REG-2026-1001',
        formNo: 'ADM-26-001',
        studentAccNo: 'ACC-1001',
        fullName: 'Rajesh Kumar Sharma',
        fatherName: 'Vijay Kumar Sharma',
        motherName: 'Suman Devi Sharma',
        mobileNumber: '9829012345',
        alternateMobile: '9829054321',
        whatsAppNo: '9829012345',
        parentsContact: '9829054321',
        aadharNo: '748291048392',
        email: 'rajesh.sharma@gmail.com',
        gender: 'Male',
        dateOfBirth: '2004-08-12',
        address: '12, Vyas Colony, Near Fort Gate',
        permanentAddress: '12, Vyas Colony, Near Fort Gate, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334001',
        category: 'General',
        medium: 'English',
        courseApplied: 'Bachelor of Laws (L.L.B.)',
        currentYear: '1st Year',
        currentSemester: 'I & II Semester',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: 'All original graduation and identity documents verified physically.',
        seatAllotted: true,
        allottedCourse: 'Bachelor of Laws (L.L.B.)',
        allottedOn: '2025-07-15',
        meritRank: 1,
        admissionBase: 'UG',
        yearlyIncomeFather: 450000,
        yearlyIncomeMother: 0,
        marks10: 84.5,
        board10: 'RBSE',
        passingYear10: '2020',
        maxMarks10: 600,
        obtainedMarks10: 507,
        marks12: 82.0,
        board12: 'RBSE',
        passingYear12: '2022',
        subject12: 'Commerce',
        maxMarks12: 500,
        obtainedMarks12: 410,
        qualExamName: 'B.Com',
        qualUniversity: 'Maharaja Ganga Singh University, Bikaner',
        qualType: 'Graduation',
        qualYear: '2025',
        qualMaxMarks: 1800,
        qualObtainedMarks: 1332,
        qualPercentage: 74.0,
        gradUniversity: 'MGSU Bikaner',
        gradYear: '2025',
        gradSubject: 'Commerce & Accountancy',
        gradMaxMarks: 1800,
        gradObtainedMarks: 1332,
        gradPercentage: 74.0,
        feesPaid: true,
        feesAmount: 16000.0,
        feesReceiptNo: 'REC-2026-00101',
        feesPaymentDate: '2025-07-16',
        feesPaymentMode: 'Cash',
        feesInstallment: '1st Installment / Admission Fee',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, graduationMarksheet: true, aadharCard: true },
        profile: { rollNo: '2026101', bloodGroup: 'B+', emergencyContact: '9829054321', hostelRequired: false }
      },
      {
        srNo: 2,
        registrationId: 'REG-2026-1002',
        formNo: 'ADM-26-002',
        studentAccNo: 'ACC-1002',
        fullName: 'Priya Choudhary',
        fatherName: 'Hargovind Choudhary',
        motherName: 'Kamla Devi',
        mobileNumber: '9414123456',
        alternateMobile: '9414198765',
        whatsAppNo: '9414123456',
        parentsContact: '9414198765',
        aadharNo: '629481720394',
        email: 'priya.choudhary@gmail.com',
        gender: 'Female',
        dateOfBirth: '2005-03-24',
        address: 'Plot 44, Sector 3, Pawanpuri',
        permanentAddress: 'Plot 44, Sector 3, Pawanpuri, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334003',
        category: 'OBC',
        medium: 'English',
        courseApplied: 'B.A. L.L.B. Integrated',
        currentYear: '1st Year',
        currentSemester: 'I & II Semester',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: 'OBC non-creamy layer certificate and 12th marksheet verified.',
        seatAllotted: true,
        allottedCourse: 'B.A. L.L.B. Integrated',
        allottedOn: '2025-07-15',
        meritRank: 2,
        admissionBase: '12th',
        yearlyIncomeFather: 380000,
        yearlyIncomeMother: 0,
        marks10: 89.2,
        board10: 'CBSE',
        passingYear10: '2021',
        maxMarks10: 500,
        obtainedMarks10: 446,
        marks12: 88.4,
        board12: 'CBSE',
        passingYear12: '2023',
        subject12: 'Humanities / Arts',
        maxMarks12: 500,
        obtainedMarks12: 442,
        qualExamName: '12th Sr. Secondary',
        qualUniversity: 'CBSE New Delhi',
        qualType: '12th',
        qualYear: '2023',
        qualMaxMarks: 500,
        qualObtainedMarks: 442,
        qualPercentage: 88.4,
        feesPaid: true,
        feesAmount: 25000.0,
        feesReceiptNo: 'REC-2026-00102',
        feesPaymentDate: '2025-07-16',
        feesPaymentMode: 'UPI',
        feesInstallment: 'Full Payment (1st & 2nd Installment)',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, casteCertificate: true, aadharCard: true },
        profile: { rollNo: '2026102', bloodGroup: 'O+', emergencyContact: '9414198765', hostelRequired: false }
      },
      {
        srNo: 3,
        registrationId: 'REG-2026-1003',
        formNo: 'ADM-26-003',
        studentAccNo: 'ACC-1003',
        fullName: 'Amit Kumar Meghwal',
        fatherName: 'Ramesh Meghwal',
        motherName: 'Santosh Devi',
        mobileNumber: '8877665544',
        alternateMobile: '8877661122',
        whatsAppNo: '8877665544',
        parentsContact: '8877661122',
        aadharNo: '519382049182',
        email: 'amit.meghwal@gmail.com',
        gender: 'Male',
        dateOfBirth: '2003-11-05',
        address: 'Ward No 5, Nokha Road',
        permanentAddress: 'Ward No 5, Nokha Road, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334803',
        category: 'SC',
        medium: 'Hindi',
        courseApplied: 'Bachelor of Laws (L.L.B.)',
        currentYear: '1st Year',
        currentSemester: 'I & II Semester',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: 'SC Certificate and B.A. Degree authenticated.',
        seatAllotted: true,
        allottedCourse: 'Bachelor of Laws (L.L.B.)',
        allottedOn: '2025-07-16',
        meritRank: 3,
        admissionBase: 'UG',
        yearlyIncomeFather: 180000,
        yearlyIncomeMother: 0,
        marks10: 76.0,
        board10: 'RBSE',
        passingYear10: '2019',
        maxMarks10: 600,
        obtainedMarks10: 456,
        marks12: 72.5,
        board12: 'RBSE',
        passingYear12: '2021',
        subject12: 'Arts',
        maxMarks12: 500,
        obtainedMarks12: 362,
        qualExamName: 'B.A.',
        qualUniversity: 'MGSU Bikaner',
        qualType: 'Graduation',
        qualYear: '2024',
        qualMaxMarks: 1800,
        qualObtainedMarks: 1233,
        qualPercentage: 68.5,
        gradUniversity: 'MGSU Bikaner',
        gradYear: '2024',
        gradSubject: 'Political Science, History',
        gradMaxMarks: 1800,
        gradObtainedMarks: 1233,
        gradPercentage: 68.5,
        feesPaid: true,
        feesAmount: 16000.0,
        feesReceiptNo: 'REC-2026-00104',
        feesPaymentDate: '2025-07-17',
        feesPaymentMode: 'Cash',
        feesInstallment: '1st Installment / Admission Fee',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, graduationMarksheet: true, casteCertificate: true, aadharCard: true },
        profile: { rollNo: '2026103', bloodGroup: 'A+', emergencyContact: '8877661122', hostelRequired: false }
      },
      {
        srNo: 4,
        registrationId: 'REG-2026-1004',
        formNo: 'ADM-26-004',
        studentAccNo: 'ACC-1004',
        fullName: 'Neha Vyas',
        fatherName: 'Sushil Vyas',
        motherName: 'Rajni Vyas',
        mobileNumber: '7766554433',
        alternateMobile: '7766559988',
        whatsAppNo: '7766554433',
        parentsContact: '7766559988',
        aadharNo: '482910482910',
        email: 'neha.vyas@gmail.com',
        gender: 'Female',
        dateOfBirth: '2002-05-18',
        address: 'B-14, Sadul Ganj, Near Public Park',
        permanentAddress: 'B-14, Sadul Ganj, Near Public Park, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334001',
        category: 'General',
        medium: 'English',
        courseApplied: 'Master of Laws (L.L.M.)',
        currentYear: '1st Year',
        currentSemester: 'Part - I',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: 'LL.B. 3-Year degree and enrollment certificate checked.',
        seatAllotted: true,
        allottedCourse: 'Master of Laws (L.L.M.)',
        allottedOn: '2025-07-16',
        meritRank: 1,
        admissionBase: 'UG',
        yearlyIncomeFather: 620000,
        yearlyIncomeMother: 300000,
        marks10: 91.0,
        board10: 'CBSE',
        passingYear10: '2018',
        maxMarks10: 500,
        obtainedMarks10: 455,
        marks12: 89.5,
        board12: 'CBSE',
        passingYear12: '2020',
        subject12: 'Science (Maths)',
        maxMarks12: 500,
        obtainedMarks12: 447,
        qualExamName: 'LL.B. (Professional)',
        qualUniversity: 'BJS Rampuria Jain Law College (MGSU)',
        qualType: 'Law Degree',
        qualYear: '2024',
        qualMaxMarks: 3000,
        qualObtainedMarks: 2184,
        qualPercentage: 72.8,
        gradUniversity: 'MGSU Bikaner',
        gradYear: '2024',
        gradSubject: 'Law',
        gradMaxMarks: 3000,
        gradObtainedMarks: 2184,
        gradPercentage: 72.8,
        feesPaid: true,
        feesAmount: 16500.0,
        feesReceiptNo: 'REC-2026-00105',
        feesPaymentDate: '2025-07-17',
        feesPaymentMode: 'Cheque',
        feesInstallment: '1st Installment / Admission Fee',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, graduationMarksheet: true, aadharCard: true },
        profile: { rollNo: '2026104', bloodGroup: 'AB+', emergencyContact: '7766559988', hostelRequired: false }
      },
      {
        srNo: 5,
        registrationId: 'REG-2026-1005',
        formNo: 'ADM-26-005',
        studentAccNo: 'ACC-1005',
        fullName: 'Vikram Singh Rathore',
        fatherName: 'Surendra Singh Rathore',
        motherName: 'Kanchan Kanwar',
        mobileNumber: '9660123456',
        alternateMobile: '9660199887',
        whatsAppNo: '9660123456',
        parentsContact: '9660199887',
        aadharNo: '394820194820',
        email: 'vikram.singh@gmail.com',
        gender: 'Male',
        dateOfBirth: '2004-09-30',
        address: '56, Karni Nagar, Industrial Area Road',
        permanentAddress: '56, Karni Nagar, Industrial Area Road, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334004',
        category: 'General',
        medium: 'English',
        courseApplied: 'B.A. L.L.B. Integrated',
        currentYear: '2nd Year',
        currentSemester: 'III & IV Semester',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: 'Promoted to 2nd Year B.A. LL.B.',
        seatAllotted: true,
        allottedCourse: 'B.A. L.L.B. Integrated',
        allottedOn: '2025-07-15',
        meritRank: 4,
        admissionBase: '12th',
        yearlyIncomeFather: 520000,
        yearlyIncomeMother: 0,
        marks10: 82.4,
        board10: 'RBSE',
        passingYear10: '2020',
        maxMarks10: 600,
        obtainedMarks10: 494,
        marks12: 81.6,
        board12: 'RBSE',
        passingYear12: '2022',
        subject12: 'Humanities',
        maxMarks12: 500,
        obtainedMarks12: 408,
        qualExamName: '12th Arts',
        qualUniversity: 'RBSE Ajmer',
        qualType: '12th',
        qualYear: '2022',
        qualMaxMarks: 500,
        qualObtainedMarks: 408,
        qualPercentage: 81.6,
        feesPaid: true,
        feesAmount: 16000.0,
        feesReceiptNo: 'REC-2026-00107',
        feesPaymentDate: '2025-07-18',
        feesPaymentMode: 'UPI',
        feesInstallment: '1st Installment / 2nd Year Renewal',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, aadharCard: true },
        profile: { rollNo: '2026105', bloodGroup: 'B-', emergencyContact: '9660199887', hostelRequired: false }
      },
      {
        srNo: 6,
        registrationId: 'REG-2026-1006',
        formNo: 'ADM-26-006',
        studentAccNo: 'ACC-1006',
        fullName: 'Sunita Meena',
        fatherName: 'Kailash Meena',
        motherName: 'Geeta Devi',
        mobileNumber: '9116234567',
        alternateMobile: '9116288776',
        whatsAppNo: '9116234567',
        parentsContact: '9116288776',
        aadharNo: '294810394820',
        email: 'sunita.meena@gmail.com',
        gender: 'Female',
        dateOfBirth: '2005-01-15',
        address: 'Ganga Shahar, Main Bazaar',
        permanentAddress: 'Ganga Shahar, Main Bazaar, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334401',
        category: 'ST',
        medium: 'Hindi',
        courseApplied: 'Bachelor of Laws (L.L.B.)',
        currentYear: '1st Year',
        currentSemester: 'I & II Semester',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: 'ST Certificate verified with original credentials.',
        seatAllotted: true,
        allottedCourse: 'Bachelor of Laws (L.L.B.)',
        allottedOn: '2025-07-17',
        meritRank: 5,
        admissionBase: 'UG',
        yearlyIncomeFather: 210000,
        yearlyIncomeMother: 0,
        marks10: 74.0,
        board10: 'RBSE',
        passingYear10: '2020',
        maxMarks10: 600,
        obtainedMarks10: 444,
        marks12: 70.2,
        board12: 'RBSE',
        passingYear12: '2022',
        subject12: 'Commerce',
        maxMarks12: 500,
        obtainedMarks12: 351,
        qualExamName: 'B.Com',
        qualUniversity: 'MGSU Bikaner',
        qualType: 'Graduation',
        qualYear: '2025',
        qualMaxMarks: 1800,
        qualObtainedMarks: 1177,
        qualPercentage: 65.4,
        gradUniversity: 'MGSU Bikaner',
        gradYear: '2025',
        gradSubject: 'Commerce',
        gradMaxMarks: 1800,
        gradObtainedMarks: 1177,
        gradPercentage: 65.4,
        feesPaid: true,
        feesAmount: 16000.0,
        feesReceiptNo: 'REC-2026-00108',
        feesPaymentDate: '2025-07-18',
        feesPaymentMode: 'Cash',
        feesInstallment: '1st Installment / Admission Fee',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, graduationMarksheet: true, casteCertificate: true, aadharCard: true },
        profile: { rollNo: '2026106', bloodGroup: 'O-', emergencyContact: '9116288776', hostelRequired: false }
      },
      {
        srNo: 7,
        registrationId: 'REG-2026-1007',
        formNo: 'ADM-26-007',
        studentAccNo: 'ACC-1007',
        fullName: 'Manish Jain',
        fatherName: 'Prakash Chandra Jain',
        motherName: 'Shashi Bala Jain',
        mobileNumber: '9783124567',
        alternateMobile: '9783199882',
        whatsAppNo: '9783124567',
        parentsContact: '9783199882',
        aadharNo: '184920194827',
        email: 'manish.jain@gmail.com',
        gender: 'Male',
        dateOfBirth: '2001-12-08',
        address: 'Rampuria Street, Old City',
        permanentAddress: 'Rampuria Street, Old City, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334001',
        category: 'General',
        medium: 'English',
        courseApplied: 'PGDCC & PGDLL',
        currentYear: 'Diploma Year',
        currentSemester: 'Annual',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: 'LL.B. Graduate diploma admission approved.',
        seatAllotted: true,
        allottedCourse: 'PGDCC & PGDLL',
        allottedOn: '2025-07-18',
        meritRank: 2,
        admissionBase: 'UG',
        yearlyIncomeFather: 480000,
        yearlyIncomeMother: 0,
        marks10: 86.0,
        board10: 'RBSE',
        passingYear10: '2017',
        maxMarks10: 600,
        obtainedMarks10: 516,
        marks12: 83.4,
        board12: 'RBSE',
        passingYear12: '2019',
        subject12: 'Commerce',
        maxMarks12: 500,
        obtainedMarks12: 417,
        qualExamName: 'LL.B.',
        qualUniversity: 'Rajasthan University, Jaipur',
        qualType: 'Graduation',
        qualYear: '2023',
        qualMaxMarks: 3000,
        qualObtainedMarks: 2103,
        qualPercentage: 70.1,
        gradUniversity: 'RU Jaipur',
        gradYear: '2023',
        gradSubject: 'Law',
        gradMaxMarks: 3000,
        gradObtainedMarks: 2103,
        gradPercentage: 70.1,
        feesPaid: true,
        feesAmount: 13500.0,
        feesReceiptNo: 'REC-2026-00109',
        feesPaymentDate: '2025-07-19',
        feesPaymentMode: 'Net Banking',
        feesInstallment: '1st Installment / Diploma Fee',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, graduationMarksheet: true, aadharCard: true },
        profile: { rollNo: '2026107', bloodGroup: 'A+', emergencyContact: '9783199882', hostelRequired: false }
      },
      {
        srNo: 8,
        registrationId: 'REG-2026-1008',
        formNo: 'ADM-26-008',
        studentAccNo: 'ACC-1008',
        fullName: 'Pooja Agarwal',
        fatherName: 'Ghanshyam Agarwal',
        motherName: 'Rekha Devi',
        mobileNumber: '9351029384',
        alternateMobile: '9351088771',
        whatsAppNo: '9351029384',
        parentsContact: '9351088771',
        aadharNo: '928471928374',
        email: 'pooja.agarwal@gmail.com',
        gender: 'Female',
        dateOfBirth: '2003-04-14',
        address: 'C-22, Rani Bazaar',
        permanentAddress: 'C-22, Rani Bazaar, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334001',
        category: 'General',
        medium: 'English',
        courseApplied: 'Bachelor of Laws (L.L.B.)',
        currentYear: '2nd Year',
        currentSemester: 'III & IV Semester',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: '2nd Year admission fees cleared.',
        seatAllotted: true,
        allottedCourse: 'Bachelor of Laws (L.L.B.)',
        allottedOn: '2025-07-19',
        meritRank: 6,
        admissionBase: 'UG',
        yearlyIncomeFather: 550000,
        yearlyIncomeMother: 0,
        marks10: 88.0,
        board10: 'CBSE',
        passingYear10: '2019',
        maxMarks10: 500,
        obtainedMarks10: 440,
        marks12: 85.6,
        board12: 'CBSE',
        passingYear12: '2021',
        subject12: 'Commerce with Maths',
        maxMarks12: 500,
        obtainedMarks12: 428,
        qualExamName: 'B.Com Honours',
        qualUniversity: 'MGSU Bikaner',
        qualType: 'Graduation',
        qualYear: '2024',
        qualMaxMarks: 1800,
        qualObtainedMarks: 1368,
        qualPercentage: 76.0,
        gradUniversity: 'MGSU Bikaner',
        gradYear: '2024',
        gradSubject: 'Commerce',
        gradMaxMarks: 1800,
        gradObtainedMarks: 1368,
        gradPercentage: 76.0,
        feesPaid: true,
        feesAmount: 16000.0,
        feesReceiptNo: 'REC-2026-00110',
        feesPaymentDate: '2025-07-20',
        feesPaymentMode: 'UPI',
        feesInstallment: '1st Installment / 2nd Year Renewal',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, graduationMarksheet: true, aadharCard: true },
        profile: { rollNo: '2026108', bloodGroup: 'B+', emergencyContact: '9351088771', hostelRequired: false }
      },
      {
        srNo: 9,
        registrationId: 'REG-2026-1009',
        formNo: 'ADM-26-009',
        studentAccNo: 'ACC-1009',
        fullName: 'Deepankar Sen',
        fatherName: 'Subhash Sen',
        motherName: 'Anuradha Sen',
        mobileNumber: '9214029384',
        alternateMobile: '9214099881',
        whatsAppNo: '9214029384',
        parentsContact: '9214099881',
        aadharNo: '719283049182',
        email: 'deepankar.sen@gmail.com',
        gender: 'Male',
        dateOfBirth: '2005-07-22',
        address: 'House 89, Subhash Pura, Lalgarh',
        permanentAddress: 'House 89, Subhash Pura, Lalgarh, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334002',
        category: 'OBC',
        medium: 'English',
        courseApplied: 'B.A. L.L.B. Integrated',
        currentYear: '1st Year',
        currentSemester: 'I & II Semester',
        academicSession: '2025-26',
        verificationStatus: 'Pending',
        verificationRemarks: 'Pending original 12th migration certificate submission.',
        seatAllotted: false,
        allottedCourse: null,
        allottedOn: null,
        meritRank: 7,
        admissionBase: '12th',
        yearlyIncomeFather: 320000,
        yearlyIncomeMother: 0,
        marks10: 71.5,
        board10: 'RBSE',
        passingYear10: '2021',
        maxMarks10: 600,
        obtainedMarks10: 429,
        marks12: 63.8,
        board12: 'RBSE',
        passingYear12: '2023',
        subject12: 'Arts',
        maxMarks12: 500,
        obtainedMarks12: 319,
        qualExamName: '12th Arts',
        qualUniversity: 'RBSE Ajmer',
        qualType: '12th',
        qualYear: '2023',
        qualMaxMarks: 500,
        qualObtainedMarks: 319,
        qualPercentage: 63.8,
        feesPaid: false,
        feesAmount: 0.0,
        feesReceiptNo: '',
        feesPaymentDate: null,
        feesPaymentMode: '',
        feesInstallment: null,
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, casteCertificate: true, aadharCard: true },
        profile: { rollNo: '2026109', bloodGroup: 'O+', emergencyContact: '9214099881', hostelRequired: true }
      },
      {
        srNo: 10,
        registrationId: 'REG-2026-1010',
        formNo: 'ADM-26-010',
        studentAccNo: 'ACC-1010',
        fullName: 'Ananya Joshi',
        fatherName: 'Mukesh Joshi',
        motherName: 'Mamta Joshi',
        mobileNumber: '9529018273',
        alternateMobile: '9529088772',
        whatsAppNo: '9529018273',
        parentsContact: '9529088772',
        aadharNo: '839201948201',
        email: 'ananya.joshi@gmail.com',
        gender: 'Female',
        dateOfBirth: '2004-10-11',
        address: 'Flat 302, Royal Enclave, Samta Nagar',
        permanentAddress: 'Flat 302, Royal Enclave, Samta Nagar, Bikaner',
        city: 'Bikaner',
        state: 'Rajasthan',
        pincode: '334001',
        category: 'General',
        medium: 'English',
        courseApplied: 'Bachelor of Laws (L.L.B.)',
        currentYear: '1st Year',
        currentSemester: 'I & II Semester',
        academicSession: '2025-26',
        verificationStatus: 'Approved',
        verificationRemarks: 'Admitted in Merit List 2.',
        seatAllotted: true,
        allottedCourse: 'Bachelor of Laws (L.L.B.)',
        allottedOn: '2025-07-21',
        meritRank: 8,
        admissionBase: 'UG',
        yearlyIncomeFather: 420000,
        yearlyIncomeMother: 0,
        marks10: 80.2,
        board10: 'CBSE',
        passingYear10: '2020',
        maxMarks10: 500,
        obtainedMarks10: 401,
        marks12: 78.4,
        board12: 'CBSE',
        passingYear12: '2022',
        subject12: 'Humanities',
        maxMarks12: 500,
        obtainedMarks12: 392,
        qualExamName: 'B.A. (Hons) English',
        qualUniversity: 'MGSU Bikaner',
        qualType: 'Graduation',
        qualYear: '2025',
        qualMaxMarks: 1800,
        qualObtainedMarks: 1245,
        qualPercentage: 69.2,
        gradUniversity: 'MGSU Bikaner',
        gradYear: '2025',
        gradSubject: 'English Literature',
        gradMaxMarks: 1800,
        gradObtainedMarks: 1245,
        gradPercentage: 69.2,
        feesPaid: true,
        feesAmount: 16000.0,
        feesReceiptNo: 'REC-2026-00111',
        feesPaymentDate: '2025-07-22',
        feesPaymentMode: 'Cash',
        feesInstallment: '1st Installment / Admission Fee',
        documents: { photo: true, signature: true, marksheet10: true, marksheet12: true, graduationMarksheet: true, aadharCard: true },
        profile: { rollNo: '2026110', bloodGroup: 'A-', emergencyContact: '9529088772', hostelRequired: false }
      }
    ];

    if (existingStudentCount < 10 || force) {
      console.log(`[Seeding] Seeding/Updating 10 rich demo students (current count = ${existingStudentCount})...`);
      for (const sData of tenDemoStudents) {
        const exist = await Student.findOne({ where: { registrationId: sData.registrationId } });
        if (!exist) {
          await Student.create(sData);
        } else if (force) {
          await exist.update(sData);
        }
      }
      console.log('[Seeding] ✓ 10 Law College demo students populated.');
    }

    const students = await Student.findAll({ order: [['srNo', 'ASC']] });

    // 5. Seed Realistic Fee Payments (Inflow / Receipts)
    const feeCount = await FeePayment.count();
    if ((feeCount < 10 || force) && students.length > 0) {
      console.log('[Seeding] Seeding comprehensive fee payments across diverse students & modes...');
      const todayStr = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterdayStr = d.toISOString().split('T')[0];
      d.setDate(d.getDate() - 1);
      const twoDaysAgoStr = d.toISOString().split('T')[0];

      const getSt = (regId) => students.find(s => s.registrationId === regId) || students[0];

      const demoPayments = [
        {
          studentId: getSt('REG-2026-1001').id,
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
          remarks: 'Admission fee deposited in cash at fee counter'
        },
        {
          studentId: getSt('REG-2026-1002').id,
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
          studentId: getSt('REG-2026-1002').id,
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
          studentId: getSt('REG-2026-1003').id,
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
          studentId: getSt('REG-2026-1004').id,
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
          studentId: getSt('REG-2026-1001').id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'I & II Semester',
          installmentName: 'Caution Money (Refundable)',
          amountPaid: 300.0,
          amountDue: 0.0,
          dueDate: null,
          receiptNo: 'REC-2026-00106',
          paymentDate: twoDaysAgoStr,
          paymentMode: 'Cash',
          transactionNo: '',
          remarks: 'College and Library caution deposit'
        },
        {
          studentId: getSt('REG-2026-1005').id,
          academicYear: '2nd Year',
          academicSession: '2025-26',
          semester: 'III & IV Semester',
          installmentName: '1st Installment / 2nd Year Renewal',
          amountPaid: 16000.0,
          amountDue: 9000.0,
          dueDate: '2026-11-15',
          receiptNo: 'REC-2026-00107',
          paymentDate: yesterdayStr,
          paymentMode: 'UPI',
          transactionNo: 'UPI/948201948201',
          remarks: '2nd Year B.A. LL.B. fee paid via PhonePe'
        },
        {
          studentId: getSt('REG-2026-1006').id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'I & II Semester',
          installmentName: '1st Installment / Admission Fee',
          amountPaid: 16000.0,
          amountDue: 9000.0,
          dueDate: '2026-11-15',
          receiptNo: 'REC-2026-00108',
          paymentDate: todayStr,
          paymentMode: 'Cash',
          transactionNo: '',
          remarks: '1st Year LL.B. fee cash receipt'
        },
        {
          studentId: getSt('REG-2026-1007').id,
          academicYear: 'Diploma Year',
          academicSession: '2025-26',
          semester: 'Annual',
          installmentName: '1st Installment / Diploma Fee',
          amountPaid: 13500.0,
          amountDue: 7500.0,
          dueDate: '2026-11-30',
          receiptNo: 'REC-2026-00109',
          paymentDate: yesterdayStr,
          paymentMode: 'Net Banking',
          transactionNo: 'NEFT/HDFC20260918',
          remarks: 'PGDLL diploma course first installment'
        },
        {
          studentId: getSt('REG-2026-1008').id,
          academicYear: '2nd Year',
          academicSession: '2025-26',
          semester: 'III & IV Semester',
          installmentName: '1st Installment / 2nd Year Renewal',
          amountPaid: 16000.0,
          amountDue: 9000.0,
          dueDate: '2026-11-15',
          receiptNo: 'REC-2026-00110',
          paymentDate: todayStr,
          paymentMode: 'UPI',
          transactionNo: 'UPI/772819203918',
          remarks: 'LL.B. 2nd Year renewal via Paytm UPI'
        },
        {
          studentId: getSt('REG-2026-1010').id,
          academicYear: '1st Year',
          academicSession: '2025-26',
          semester: 'I & II Semester',
          installmentName: '1st Installment / Admission Fee',
          amountPaid: 16000.0,
          amountDue: 9000.0,
          dueDate: '2026-11-15',
          receiptNo: 'REC-2026-00111',
          paymentDate: todayStr,
          paymentMode: 'Cash',
          transactionNo: '',
          remarks: 'Merit list admission payment counter deposit'
        }
      ];

      for (const p of demoPayments) {
        const exist = await FeePayment.findOne({ where: { receiptNo: p.receiptNo } });
        if (!exist) {
          await FeePayment.create(p);
        }
      }
      console.log(`[Seeding] ✓ Seeded ${demoPayments.length} fee payment receipts.`);
    }

    // 6. Seed Operational Debit Vouchers (Expenses)
    const expenseCount = await Expense.count();
    if (expenseCount < 7 || force) {
      console.log('[Seeding] Seeding operational expense debit vouchers...');
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
        },
        {
          voucherNo: 'EXP-2026-0008',
          category: 'Sports & Cultural Events',
          expenseDate: todayStr,
          paidTo: 'National Sports Emporium, Station Road',
          amount: 4500.0,
          paymentMode: 'UPI',
          transactionRef: 'UPI/8849201948',
          narration: 'Badminton racquets, shuttlecocks, chess boards and table tennis accessories for common room.',
          academicSession: '2025-26',
          authorizedBy: 'SuperAdmin',
          status: 'APPROVED'
        }
      ];

      for (const e of demoExpenses) {
        const exist = await Expense.findOne({ where: { voucherNo: e.voucherNo } });
        if (!exist) {
          await Expense.create(e);
        }
      }
      console.log(`[Seeding] ✓ Seeded ${demoExpenses.length} expense debit vouchers.`);
    }

    // 7. Seed Law Library Books
    const bookCount = await Book.count();
    const demoBooks = [
      {
        bookNo: 'LAW-001',
        title: 'Constitutional Law of India (Vol 1 & 2)',
        author: 'Dr. J. N. Pandey',
        publisher: 'Central Law Agency',
        subject: 'Constitutional Law',
        totalCopies: 10,
        availableCopies: 8,
        shelfLocation: 'Rack A-1',
        price: 950.0
      },
      {
        bookNo: 'LAW-002',
        title: 'Indian Penal Code & Bharatiya Nyaya Sanhita',
        author: 'Ratanlal & Dhirajlal',
        publisher: 'LexisNexis',
        subject: 'Criminal Law',
        totalCopies: 12,
        availableCopies: 9,
        shelfLocation: 'Rack A-2',
        price: 1200.0
      },
      {
        bookNo: 'LAW-003',
        title: 'Law of Torts and Consumer Protection',
        author: 'Dr. R. K. Bangia',
        publisher: 'Allahabad Law Agency',
        subject: 'Civil Law',
        totalCopies: 8,
        availableCopies: 6,
        shelfLocation: 'Rack B-1',
        price: 650.0
      },
      {
        bookNo: 'LAW-004',
        title: 'Code of Criminal Procedure & BNSS',
        author: 'S. N. Mishra',
        publisher: 'Central Law Publications',
        subject: 'Criminal Procedure',
        totalCopies: 8,
        availableCopies: 7,
        shelfLocation: 'Rack B-2',
        price: 1100.0
      },
      {
        bookNo: 'LAW-005',
        title: 'Law of Evidence & Bharatiya Sakshya Adhiniyam',
        author: 'Batuk Lal',
        publisher: 'Central Law Agency',
        subject: 'Law of Evidence',
        totalCopies: 10,
        availableCopies: 8,
        shelfLocation: 'Rack C-1',
        price: 850.0
      },
      {
        bookNo: 'LAW-006',
        title: 'Administrative Law',
        author: 'Dr. I. P. Massey',
        publisher: 'Eastern Book Company',
        subject: 'Public Law',
        totalCopies: 6,
        availableCopies: 5,
        shelfLocation: 'Rack C-2',
        price: 750.0
      },
      {
        bookNo: 'LAW-007',
        title: 'Family Law (Hindu & Muslim Personal Law)',
        author: 'Dr. Paras Diwan',
        publisher: 'Allahabad Law Agency',
        subject: 'Family Law',
        totalCopies: 8,
        availableCopies: 7,
        shelfLocation: 'Rack D-1',
        price: 800.0
      },
      {
        bookNo: 'LAW-008',
        title: 'Environmental Law in India',
        author: 'P. Leelakrishnan',
        publisher: 'LexisNexis',
        subject: 'Environmental Law',
        totalCopies: 6,
        availableCopies: 6,
        shelfLocation: 'Rack D-2',
        price: 900.0
      }
    ];

    if (bookCount < 8 || force) {
      for (const b of demoBooks) {
        const exist = await Book.findOne({ where: { bookNo: b.bookNo } });
        if (!exist) {
          await Book.create(b);
        }
      }
      console.log(`[Seeding] ✓ Seeded ${demoBooks.length} Law Library books.`);
    }

    const books = await Book.findAll();

    // 8. Seed Library Book Issues
    const issueCount = await BookIssue.count();
    if ((issueCount < 6 || force) && students.length > 0 && books.length > 0) {
      console.log('[Seeding] Seeding library circulation issues...');
      const todayStr = new Date().toISOString().split('T')[0];
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const sevenDaysAgo = d.toISOString().split('T')[0];
      d.setDate(d.getDate() - 10);
      const seventeenDaysAgo = d.toISOString().split('T')[0];
      const futureDue = new Date();
      futureDue.setDate(futureDue.getDate() + 7);
      const futureDueStr = futureDue.toISOString().split('T')[0];

      const getSt = (regId) => students.find(s => s.registrationId === regId) || students[0];
      const getBk = (bNo) => books.find(b => b.bookNo === bNo) || books[0];

      const demoIssues = [
        {
          studentId: getSt('REG-2026-1001').id,
          bookId: getBk('LAW-001').id,
          issueDate: sevenDaysAgo,
          dueDate: futureDueStr,
          returnDate: null,
          fineAmount: 0,
          status: 'Issued',
          remarks: 'Issued for Constitutional Law semester project'
        },
        {
          studentId: getSt('REG-2026-1002').id,
          bookId: getBk('LAW-002').id,
          issueDate: seventeenDaysAgo,
          dueDate: sevenDaysAgo,
          returnDate: todayStr,
          fineAmount: 0,
          status: 'Returned',
          remarks: 'Returned in good condition on time'
        },
        {
          studentId: getSt('REG-2026-1003').id,
          bookId: getBk('LAW-003').id,
          issueDate: sevenDaysAgo,
          dueDate: futureDueStr,
          returnDate: null,
          fineAmount: 0,
          status: 'Issued',
          remarks: 'Issued for Torts moot court assignment'
        },
        {
          studentId: getSt('REG-2026-1004').id,
          bookId: getBk('LAW-004').id,
          issueDate: seventeenDaysAgo,
          dueDate: sevenDaysAgo,
          returnDate: null,
          fineAmount: 50.0,
          status: 'Overdue',
          remarks: 'Overdue by 7 days, fine ₹50 calculated'
        },
        {
          studentId: getSt('REG-2026-1005').id,
          bookId: getBk('LAW-005').id,
          issueDate: sevenDaysAgo,
          dueDate: futureDueStr,
          returnDate: null,
          fineAmount: 0,
          status: 'Issued',
          remarks: 'Issued for Law of Evidence study'
        },
        {
          studentId: getSt('REG-2026-1006').id,
          bookId: getBk('LAW-006').id,
          issueDate: seventeenDaysAgo,
          dueDate: sevenDaysAgo,
          returnDate: todayStr,
          fineAmount: 0,
          status: 'Returned',
          remarks: 'Returned successfully'
        }
      ];

      for (const iss of demoIssues) {
        const exist = await BookIssue.findOne({
          where: { studentId: iss.studentId, bookId: iss.bookId, issueDate: iss.issueDate }
        });
        if (!exist) {
          await BookIssue.create(iss);
        }
      }
      console.log(`[Seeding] ✓ Seeded ${demoIssues.length} library book circulation records.`);
    }

    // 9. Seed Results & Marksheets for 10 Students
    const resultCount = await Result.count();
    if (resultCount < 10 || force) {
      console.log('[Seeding] Seeding 10 comprehensive examination results / marksheets...');
      const getSt = (regId) => students.find(s => s.registrationId === regId);

      const demoResults = [
        {
          studentId: getSt('REG-2026-1001')?.id,
          registrationId: 'REG-2026-1001',
          rollNo: '2026101',
          studentName: 'Rajesh Kumar Sharma',
          fatherName: 'Vijay Kumar Sharma',
          course: 'Bachelor of Laws (L.L.B.)',
          academicSession: '2025-26',
          year: '1st Year',
          semester: 'I & II Semester',
          examType: 'Main Annual Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'LLB-101', name: 'Jurisprudence (Legal Theory)', maxMarks: 100, minMarks: 36, obtainedMarks: 78, status: 'Pass' },
            { code: 'LLB-102', name: 'Law of Contract - I', maxMarks: 100, minMarks: 36, obtainedMarks: 74, status: 'Pass' },
            { code: 'LLB-103', name: 'Constitutional Law of India - I', maxMarks: 100, minMarks: 36, obtainedMarks: 82, status: 'Pass' },
            { code: 'LLB-104', name: 'Law of Torts & Consumer Protection', maxMarks: 100, minMarks: 36, obtainedMarks: 79, status: 'Pass' },
            { code: 'LLB-105', name: 'Family Law - I (Hindu Law)', maxMarks: 100, minMarks: 36, obtainedMarks: 81, status: 'Pass' }
          ],
          totalMaxMarks: 500,
          totalObtainedMarks: 394,
          percentage: 78.8,
          resultStatus: 'Pass',
          division: 'First Division with Distinction',
          remarks: 'Outstanding performance across all law papers.'
        },
        {
          studentId: getSt('REG-2026-1002')?.id,
          registrationId: 'REG-2026-1002',
          rollNo: '2026102',
          studentName: 'Priya Choudhary',
          fatherName: 'Hargovind Choudhary',
          course: 'B.A. L.L.B. Integrated',
          academicSession: '2025-26',
          year: '1st Year',
          semester: 'I & II Semester',
          examType: 'Main Annual Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'BALLB-101', name: 'General English & Legal Language', maxMarks: 100, minMarks: 36, obtainedMarks: 85, status: 'Pass' },
            { code: 'BALLB-102', name: 'Political Science - I', maxMarks: 100, minMarks: 36, obtainedMarks: 80, status: 'Pass' },
            { code: 'BALLB-103', name: 'Sociology - I', maxMarks: 100, minMarks: 36, obtainedMarks: 82, status: 'Pass' },
            { code: 'BALLB-104', name: 'Law of Torts', maxMarks: 100, minMarks: 36, obtainedMarks: 88, status: 'Pass' },
            { code: 'BALLB-105', name: 'Constitutional History of India', maxMarks: 100, minMarks: 36, obtainedMarks: 86, status: 'Pass' }
          ],
          totalMaxMarks: 500,
          totalObtainedMarks: 421,
          percentage: 84.2,
          resultStatus: 'Pass',
          division: 'First Division with Distinction',
          remarks: 'Secured Top Rank in B.A. LL.B. Integrated I Year.'
        },
        {
          studentId: getSt('REG-2026-1003')?.id,
          registrationId: 'REG-2026-1003',
          rollNo: '2026103',
          studentName: 'Amit Kumar Meghwal',
          fatherName: 'Ramesh Meghwal',
          course: 'Bachelor of Laws (L.L.B.)',
          academicSession: '2025-26',
          year: '1st Year',
          semester: 'I & II Semester',
          examType: 'Main Annual Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'LLB-101', name: 'Jurisprudence (Legal Theory)', maxMarks: 100, minMarks: 36, obtainedMarks: 65, status: 'Pass' },
            { code: 'LLB-102', name: 'Law of Contract - I', maxMarks: 100, minMarks: 36, obtainedMarks: 68, status: 'Pass' },
            { code: 'LLB-103', name: 'Constitutional Law of India - I', maxMarks: 100, minMarks: 36, obtainedMarks: 72, status: 'Pass' },
            { code: 'LLB-104', name: 'Law of Torts & Consumer Protection', maxMarks: 100, minMarks: 36, obtainedMarks: 64, status: 'Pass' },
            { code: 'LLB-105', name: 'Family Law - I (Hindu Law)', maxMarks: 100, minMarks: 36, obtainedMarks: 70, status: 'Pass' }
          ],
          totalMaxMarks: 500,
          totalObtainedMarks: 339,
          percentage: 67.8,
          resultStatus: 'Pass',
          division: 'First Division',
          remarks: 'Good academic performance.'
        },
        {
          studentId: getSt('REG-2026-1004')?.id,
          registrationId: 'REG-2026-1004',
          rollNo: '2026104',
          studentName: 'Neha Vyas',
          fatherName: 'Sushil Vyas',
          course: 'Master of Laws (L.L.M.)',
          academicSession: '2025-26',
          year: '1st Year',
          semester: 'Part - I',
          examType: 'Post Graduate Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'LLM-101', name: 'Law and Social Transformation in India', maxMarks: 100, minMarks: 40, obtainedMarks: 76, status: 'Pass' },
            { code: 'LLM-102', name: 'Indian Constitutional Law: New Challenges', maxMarks: 100, minMarks: 40, obtainedMarks: 80, status: 'Pass' },
            { code: 'LLM-103', name: 'Judicial Process & Legal Theory', maxMarks: 100, minMarks: 40, obtainedMarks: 74, status: 'Pass' },
            { code: 'LLM-104', name: 'Legal Education & Research Methodology', maxMarks: 100, minMarks: 40, obtainedMarks: 78, status: 'Pass' }
          ],
          totalMaxMarks: 400,
          totalObtainedMarks: 308,
          percentage: 77.0,
          resultStatus: 'Pass',
          division: 'First Division with Distinction',
          remarks: 'Excellent research aptitude and legal analysis.'
        },
        {
          studentId: getSt('REG-2026-1005')?.id,
          registrationId: 'REG-2026-1005',
          rollNo: '2026105',
          studentName: 'Vikram Singh Rathore',
          fatherName: 'Surendra Singh Rathore',
          course: 'B.A. L.L.B. Integrated',
          academicSession: '2025-26',
          year: '2nd Year',
          semester: 'III & IV Semester',
          examType: 'Main Annual Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'BALLB-201', name: 'Constitutional Law - II', maxMarks: 100, minMarks: 36, obtainedMarks: 75, status: 'Pass' },
            { code: 'BALLB-202', name: 'Special Contracts - II', maxMarks: 100, minMarks: 36, obtainedMarks: 72, status: 'Pass' },
            { code: 'BALLB-203', name: 'Family Law - II (Muslim Law)', maxMarks: 100, minMarks: 36, obtainedMarks: 70, status: 'Pass' },
            { code: 'BALLB-204', name: 'Sociology - II (Social Problems)', maxMarks: 100, minMarks: 36, obtainedMarks: 78, status: 'Pass' },
            { code: 'BALLB-205', name: 'Political Science - II', maxMarks: 100, minMarks: 36, obtainedMarks: 76, status: 'Pass' }
          ],
          totalMaxMarks: 500,
          totalObtainedMarks: 371,
          percentage: 74.2,
          resultStatus: 'Pass',
          division: 'First Division',
          remarks: 'Cleared 2nd Year successfully.'
        },
        {
          studentId: getSt('REG-2026-1006')?.id,
          registrationId: 'REG-2026-1006',
          rollNo: '2026106',
          studentName: 'Sunita Meena',
          fatherName: 'Kailash Meena',
          course: 'Bachelor of Laws (L.L.B.)',
          academicSession: '2025-26',
          year: '1st Year',
          semester: 'I & II Semester',
          examType: 'Main Annual Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'LLB-101', name: 'Jurisprudence (Legal Theory)', maxMarks: 100, minMarks: 36, obtainedMarks: 62, status: 'Pass' },
            { code: 'LLB-102', name: 'Law of Contract - I', maxMarks: 100, minMarks: 36, obtainedMarks: 58, status: 'Pass' },
            { code: 'LLB-103', name: 'Constitutional Law of India - I', maxMarks: 100, minMarks: 36, obtainedMarks: 65, status: 'Pass' },
            { code: 'LLB-104', name: 'Law of Torts & Consumer Protection', maxMarks: 100, minMarks: 36, obtainedMarks: 60, status: 'Pass' },
            { code: 'LLB-105', name: 'Family Law - I (Hindu Law)', maxMarks: 100, minMarks: 36, obtainedMarks: 64, status: 'Pass' }
          ],
          totalMaxMarks: 500,
          totalObtainedMarks: 309,
          percentage: 61.8,
          resultStatus: 'Pass',
          division: 'First Division',
          remarks: 'Consistent academic record.'
        },
        {
          studentId: getSt('REG-2026-1007')?.id,
          registrationId: 'REG-2026-1007',
          rollNo: '2026107',
          studentName: 'Manish Jain',
          fatherName: 'Prakash Chandra Jain',
          course: 'PGDCC & PGDLL',
          academicSession: '2025-26',
          year: 'Diploma Year',
          semester: 'Annual',
          examType: 'Post Graduate Diploma Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'PGDLL-101', name: 'Industrial Relations & Labor Law', maxMarks: 100, minMarks: 40, obtainedMarks: 75, status: 'Pass' },
            { code: 'PGDLL-102', name: 'Social Security Legislation', maxMarks: 100, minMarks: 40, obtainedMarks: 72, status: 'Pass' },
            { code: 'PGDLL-103', name: 'Criminology & Penology', maxMarks: 100, minMarks: 40, obtainedMarks: 70, status: 'Pass' },
            { code: 'PGDLL-104', name: 'Cyber Crimes & IT Act', maxMarks: 100, minMarks: 40, obtainedMarks: 78, status: 'Pass' }
          ],
          totalMaxMarks: 400,
          totalObtainedMarks: 295,
          percentage: 73.75,
          resultStatus: 'Pass',
          division: 'First Division',
          remarks: 'PG Diploma in Labor Law successfully completed.'
        },
        {
          studentId: getSt('REG-2026-1008')?.id,
          registrationId: 'REG-2026-1008',
          rollNo: '2026108',
          studentName: 'Pooja Agarwal',
          fatherName: 'Ghanshyam Agarwal',
          course: 'Bachelor of Laws (L.L.B.)',
          academicSession: '2025-26',
          year: '2nd Year',
          semester: 'III & IV Semester',
          examType: 'Main Annual Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'LLB-201', name: 'Constitutional Law - II', maxMarks: 100, minMarks: 36, obtainedMarks: 76, status: 'Pass' },
            { code: 'LLB-202', name: 'Law of Crimes - I (IPC)', maxMarks: 100, minMarks: 36, obtainedMarks: 80, status: 'Pass' },
            { code: 'LLB-203', name: 'Property Law & Easements', maxMarks: 100, minMarks: 36, obtainedMarks: 74, status: 'Pass' },
            { code: 'LLB-204', name: 'Company Law & Corporate Governance', maxMarks: 100, minMarks: 36, obtainedMarks: 82, status: 'Pass' },
            { code: 'LLB-205', name: 'Public International Law & Human Rights', maxMarks: 100, minMarks: 36, obtainedMarks: 78, status: 'Pass' }
          ],
          totalMaxMarks: 500,
          totalObtainedMarks: 390,
          percentage: 78.0,
          resultStatus: 'Pass',
          division: 'First Division with Distinction',
          remarks: 'High distinction in Company Law & IPC.'
        },
        {
          studentId: getSt('REG-2026-1009')?.id,
          registrationId: 'REG-2026-1009',
          rollNo: '2026109',
          studentName: 'Deepankar Sen',
          fatherName: 'Subhash Sen',
          course: 'B.A. L.L.B. Integrated',
          academicSession: '2025-26',
          year: '1st Year',
          semester: 'I & II Semester',
          examType: 'Main Annual Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'BALLB-101', name: 'General English & Legal Language', maxMarks: 100, minMarks: 36, obtainedMarks: 54, status: 'Pass' },
            { code: 'BALLB-102', name: 'Political Science - I', maxMarks: 100, minMarks: 36, obtainedMarks: 48, status: 'Pass' },
            { code: 'BALLB-103', name: 'Sociology - I', maxMarks: 100, minMarks: 36, obtainedMarks: 52, status: 'Pass' },
            { code: 'BALLB-104', name: 'Law of Torts', maxMarks: 100, minMarks: 36, obtainedMarks: 32, status: 'Due / Re-appear' },
            { code: 'BALLB-105', name: 'Constitutional History of India', maxMarks: 100, minMarks: 36, obtainedMarks: 50, status: 'Pass' }
          ],
          totalMaxMarks: 500,
          totalObtainedMarks: 236,
          percentage: 47.2,
          resultStatus: 'Supplementary',
          division: 'Supplementary in Law of Torts',
          remarks: 'Eligible for Supplementary Examination in BALLB-104.'
        },
        {
          studentId: getSt('REG-2026-1010')?.id,
          registrationId: 'REG-2026-1010',
          rollNo: '2026110',
          studentName: 'Ananya Joshi',
          fatherName: 'Mukesh Joshi',
          course: 'Bachelor of Laws (L.L.B.)',
          academicSession: '2025-26',
          year: '1st Year',
          semester: 'I & II Semester',
          examType: 'Main Annual Exam',
          examMonthYear: 'May 2026',
          subjects: [
            { code: 'LLB-101', name: 'Jurisprudence (Legal Theory)', maxMarks: 100, minMarks: 36, obtainedMarks: 70, status: 'Pass' },
            { code: 'LLB-102', name: 'Law of Contract - I', maxMarks: 100, minMarks: 36, obtainedMarks: 68, status: 'Pass' },
            { code: 'LLB-103', name: 'Constitutional Law of India - I', maxMarks: 100, minMarks: 36, obtainedMarks: 72, status: 'Pass' },
            { code: 'LLB-104', name: 'Law of Torts & Consumer Protection', maxMarks: 100, minMarks: 36, obtainedMarks: 74, status: 'Pass' },
            { code: 'LLB-105', name: 'Family Law - I (Hindu Law)', maxMarks: 100, minMarks: 36, obtainedMarks: 66, status: 'Pass' }
          ],
          totalMaxMarks: 500,
          totalObtainedMarks: 350,
          percentage: 70.0,
          resultStatus: 'Pass',
          division: 'First Division',
          remarks: 'First Division with commendable overall score.'
        }
      ];

      for (const resData of demoResults) {
        if (!resData.studentId) {
          const st = await Student.findOne({ where: { registrationId: resData.registrationId } });
          if (st) resData.studentId = st.id;
        }
        const exist = await Result.findOne({ where: { rollNo: resData.rollNo } });
        if (!exist) {
          await Result.create(resData);
        } else if (force) {
          await exist.update(resData);
        }
      }
      console.log(`[Seeding] ✓ Seeded ${demoResults.length} student marksheets & results.`);
    }

    // 10. Seed Document Checklist Settings if empty
    const docCount = await DocSetting.count();
    if (docCount === 0 || force) {
      const defaultDocs = [
        { key: 'photo', label: 'Passport Size Photograph', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 1 },
        { key: 'signature', label: 'Candidate Signature', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 2 },
        { key: 'marksheet10', label: '10th Secondary Marksheet', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 3 },
        { key: 'marksheet12', label: '12th Sr. Secondary Marksheet', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 4 },
        { key: 'graduationMarksheet', label: 'Graduation / Qualifying Marksheet', isEnabled: true, isRequired: false, isCustom: false, displayOrder: 5 },
        { key: 'casteCertificate', label: 'Caste Certificate (SC/ST/OBC/EWS)', isEnabled: true, isRequired: false, isCustom: false, displayOrder: 6 },
        { key: 'aadharCard', label: 'Aadhar Card / Identity Proof', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 7 },
        { key: 'domicileCertificate', label: 'Domicile / Residence Certificate', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 8 }
      ];
      for (const doc of defaultDocs) {
        const exist = await DocSetting.findOne({ where: { key: doc.key } });
        if (!exist) await DocSetting.create(doc);
      }
    }

    // 11. Seed Institutional Branding Settings in AppSetting
    const collegeProfileKey = 'college_profile';
    const collegeProfileSetting = await AppSetting.findOne({ where: { key: collegeProfileKey } });
    if (!collegeProfileSetting) {
      await AppSetting.create({
        key: collegeProfileKey,
        value: JSON.stringify({
          collegeName: 'B.J.S. Rampuria Jain Law College',
          affiliation: 'Affiliated to Maharaja Ganga Singh University, Bikaner & Approved by BCI, New Delhi',
          address: 'Vyapar Mandal Path, Near Rampuria Haveli, Bikaner (Raj.) 334001',
          contact: 'Tel: 0151-2200123 | Email: info@rampurialaw.ac.in | Web: www.rampurialawcollege.ac.in',
          established: '1970',
          collegeCode: 'BJS-01',
          logoUrl: '/assets/college_logo.png'
        }),
        description: 'Official College Profile and Printing Header Information'
      });
    }

    console.log('[Seeding] ✓ Comprehensive 10-student ERP database seeding completed successfully!');
  } catch (error) {
    console.error(`[Seeding] Error during database seeding: ${error.message}`, error.stack);
  }
};

module.exports = seedData;
