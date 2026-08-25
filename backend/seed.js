const Admin = require('./models/Admin');
const Course = require('./models/Course');

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

    console.log('[Seeding] ✓ Database seed check complete.');
  } catch (error) {
    console.error(`[Seeding] Error during seeding: ${error.message}`);
  }
};

module.exports = seedData;
