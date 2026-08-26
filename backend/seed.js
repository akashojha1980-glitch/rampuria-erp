const Admin = require('./models/Admin');
const Course = require('./models/Course');
const Student = require('./models/Student');
const FeePayment = require('./models/FeePayment');
const Book = require('./models/Book');
const BookIssue = require('./models/BookIssue');

const seedData = async () => {
  console.log('[Seeding] Starting database seed check...');

  try {
    // 1. Seed Admin
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        username: 'admin',
        password: 'admin123', // Hashed automatically by Admin hooks
        name: 'System Administrator',
        role: 'SuperAdmin',
        permissions: '["dashboard","registration","verification","fees","library"]'
      });
      console.log('[Seeding] ✓ Default Admin created successfully!');
      console.log('  Username: admin');
      console.log('  Password: admin123');
    } else {
      console.log('[Seeding] Admin account already exists. Ensuring SuperAdmin role...');
      const defaultAdmin = await Admin.findOne({ where: { username: 'admin' } });
      if (defaultAdmin) {
        defaultAdmin.role = 'SuperAdmin';
        defaultAdmin.permissions = '["dashboard","registration","verification","fees","library"]';
        await defaultAdmin.save();
        console.log('[Seeding] ✓ Default Admin verified as SuperAdmin.');
      }
    }

    // 2. Seed Standard Courses
    const courseCount = await Course.count();
    if (courseCount === 0) {
      const courses = [
        {
          name: 'Bachelor of Computer Applications',
          code: 'BCA',
          duration: '3 Years',
          totalSeats: 60,
          cutoffMarks: 50,
          reservations: { General: 30, OBC: 16, SC: 9, ST: 5 }
        },
        {
          name: 'Bachelor of Business Administration',
          code: 'BBA',
          duration: '3 Years',
          totalSeats: 60,
          cutoffMarks: 45,
          reservations: { General: 30, OBC: 16, SC: 9, ST: 5 }
        },
        {
          name: 'B.Sc. Computer Science',
          code: 'BSC_CS',
          duration: '3 Years',
          totalSeats: 40,
          cutoffMarks: 55,
          reservations: { General: 20, OBC: 11, SC: 6, ST: 3 }
        },
        {
          name: 'Bachelor of Commerce',
          code: 'BCOM',
          duration: '3 Years',
          totalSeats: 80,
          cutoffMarks: 40,
          reservations: { General: 40, OBC: 22, SC: 12, ST: 6 }
        },
        {
          name: 'B.Tech Computer Science & Engineering',
          code: 'BTECH_CSE',
          duration: '4 Years',
          totalSeats: 120,
          cutoffMarks: 60,
          reservations: { General: 60, OBC: 32, SC: 18, ST: 10 }
        }
      ];

      await Course.bulkCreate(courses);
      console.log(`[Seeding] ✓ Created ${courses.length} courses successfully!`);
    } else {
      console.log('[Seeding] Courses already exist. Skipping.');
    }

    // 3. Seed Portfolio Demo Students (Only if DB is empty of students)
    const studentCount = await Student.count();
    if (studentCount === 0) {
      console.log('[Seeding] Populating realistic dummy student data for portfolio preview...');
      
      const demoStudents = [
        {
          registrationId: 'REG-2026-00001',
          fullName: 'Rajesh Kumar Sharma',
          fatherName: 'Vijay Kumar Sharma',
          motherName: 'Suman Devi',
          mobileNumber: '9876543210',
          email: 'rajesh.sharma@demo.com',
          gender: 'Male',
          dateOfBirth: '2005-08-12',
          address: '12, Vyas Colony',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334001',
          category: 'General',
          courseApplied: 'BCA',
          marks10: 82.5,
          board10: 'BSER',
          passingYear10: '2021',
          marks12: 78.4,
          board12: 'BSER',
          passingYear12: '2023',
          subject12: 'Science Math',
          verificationStatus: 'Approved',
          verificationRemarks: 'Documents verified. Cut-off met.',
          seatAllotted: true,
          allottedCourse: 'BCA',
          allottedOn: new Date(),
          meritRank: 14,
          admissionBase: 'UG'
        },
        {
          registrationId: 'REG-2026-00002',
          fullName: 'Priya Choudhary',
          fatherName: 'Hargovind Choudhary',
          motherName: 'Kamla Devi',
          mobileNumber: '9414123456',
          email: 'priya.ch@demo.com',
          gender: 'Female',
          dateOfBirth: '2006-03-24',
          address: 'Plot 44, Pawanpuri',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334003',
          category: 'OBC',
          courseApplied: 'BBA',
          marks10: 76.2,
          board10: 'CBSE',
          passingYear10: '2022',
          marks12: 81.0,
          board12: 'CBSE',
          passingYear12: '2024',
          subject12: 'Commerce',
          verificationStatus: 'Approved',
          verificationRemarks: 'OBC certificate valid. Cut-off met.',
          seatAllotted: true,
          allottedCourse: 'BBA',
          allottedOn: new Date(),
          meritRank: 8,
          admissionBase: 'UG'
        },
        {
          registrationId: 'REG-2026-00003',
          fullName: 'Amit Kumar Meghwal',
          fatherName: 'Ramesh Meghwal',
          motherName: 'Santosh Devi',
          mobileNumber: '8877665544',
          email: 'amit.meghwal@demo.com',
          gender: 'Male',
          dateOfBirth: '2005-11-05',
          address: 'Ward No 5, Nokha',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334803',
          category: 'SC',
          courseApplied: 'BTECH_CSE',
          marks10: 68.4,
          board10: 'BSER',
          passingYear10: '2021',
          marks12: 65.2,
          board12: 'BSER',
          passingYear12: '2023',
          subject12: 'Science Math',
          verificationStatus: 'Pending',
          verificationRemarks: '',
          seatAllotted: false,
          admissionBase: 'UG'
        },
        {
          registrationId: 'REG-2026-00004',
          fullName: 'Neha Vyas',
          fatherName: 'Sushil Vyas',
          motherName: 'Rajni Vyas',
          mobileNumber: '7766554433',
          email: 'neha.vyas@demo.com',
          gender: 'Female',
          dateOfBirth: '2006-05-18',
          address: 'Sadul Ganj',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334001',
          category: 'General',
          courseApplied: 'BSC_CS',
          marks10: 44.5,
          board10: 'BSER',
          passingYear10: '2022',
          marks12: 48.0,
          board12: 'BSER',
          passingYear12: '2024',
          subject12: 'Arts',
          verificationStatus: 'Rejected',
          verificationRemarks: 'Science stream required for B.Sc. CS.',
          seatAllotted: false,
          admissionBase: 'UG'
        },
        {
          registrationId: 'REG-2026-00005',
          fullName: 'Vikram Singh Shekhawat',
          fatherName: 'Surendra Singh',
          motherName: 'Kanchan Kanwar',
          mobileNumber: '9660123456',
          email: 'vikram.singh@demo.com',
          gender: 'Male',
          dateOfBirth: '2005-09-30',
          address: 'Karni Nagar',
          city: 'Bikaner',
          state: 'Rajasthan',
          pincode: '334004',
          category: 'General',
          courseApplied: 'BCOM',
          marks10: 91.0,
          board10: 'CBSE',
          passingYear10: '2021',
          marks12: 88.5,
          board12: 'CBSE',
          passingYear12: '2023',
          subject12: 'Commerce',
          verificationStatus: 'Approved',
          verificationRemarks: 'Verified.',
          seatAllotted: true,
          allottedCourse: 'BCOM',
          allottedOn: new Date(),
          meritRank: 2,
          admissionBase: 'UG'
        }
      ];

      const createdStudents = await Student.bulkCreate(demoStudents);
      console.log(`[Seeding] ✓ Seeded ${createdStudents.length} dummy students successfully.`);

      // 4. Seed Fee Payments for Allotted Students
      const rajesh = createdStudents.find(s => s.fullName.includes('Rajesh'));
      const priya = createdStudents.find(s => s.fullName.includes('Priya'));
      const vikram = createdStudents.find(s => s.fullName.includes('Vikram'));

      const demoPayments = [
        {
          studentId: rajesh.id,
          amountPaid: 15000.0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'Cash',
          transactionId: 'TXN-2026-10081',
          installmentNo: 1,
          remarks: 'First installment paid on admission.'
        },
        {
          studentId: priya.id,
          amountPaid: 25000.0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'UPI',
          transactionId: 'TXN-2026-10082',
          installmentNo: 1,
          remarks: 'Full fees paid.'
        },
        {
          studentId: vikram.id,
          amountPaid: 20000.0,
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMode: 'Bank Transfer',
          transactionId: 'TXN-2026-10083',
          installmentNo: 1,
          remarks: 'First installment.'
        }
      ];

      await FeePayment.bulkCreate(demoPayments);
      console.log(`[Seeding] ✓ Seeded fee payments successfully.`);

      // 5. Seed Library Books
      const demoBooks = [
        {
          bookId: 'BK-001',
          title: 'Introduction to Computer Science',
          author: 'P. K. Sinha',
          publisher: 'BPB Publications',
          category: 'Computer Science',
          totalCopies: 5,
          availableCopies: 4
        },
        {
          bookId: 'BK-002',
          title: 'Management Principles & Practice',
          author: 'L. M. Prasad',
          publisher: 'Sultan Chand & Sons',
          category: 'Management',
          totalCopies: 4,
          availableCopies: 3
        },
        {
          bookId: 'BK-003',
          title: 'Data Structures and Algorithms',
          author: 'Reema Thareja',
          publisher: 'Oxford University Press',
          category: 'Programming',
          totalCopies: 3,
          availableCopies: 3
        }
      ];

      const createdBooks = await Book.bulkCreate(demoBooks);
      console.log(`[Seeding] ✓ Seeded ${createdBooks.length} library books successfully.`);

      // 6. Seed Book Issues
      const book1 = createdBooks.find(b => b.bookId === 'BK-001');
      const book2 = createdBooks.find(b => b.bookId === 'BK-002');

      const demoIssues = [
        {
          studentId: rajesh.id,
          bookId: book1.id,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days later
          status: 'Issued'
        },
        {
          studentId: priya.id,
          bookId: book2.id,
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'Issued'
        }
      ];

      await BookIssue.bulkCreate(demoIssues);
      console.log(`[Seeding] ✓ Seeded library book issues successfully.`);
    }

    console.log('[Seeding] ✓ Database seed check complete.');
  } catch (error) {
    console.error(`[Seeding] Error during seeding: ${error.message}`);
  }
};

module.exports = seedData;
