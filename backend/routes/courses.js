const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// Official Prospectus Fee Structure (Page 17 Master Data)
const PROSPECTUS_FEE_STRUCTURES = [
  {
    name: 'LL.B. I & II Semester',
    code: 'LLB-SEM1-2',
    duration: '1 Year (Sem I & II)',
    totalSeats: 240,
    cutoffMarks: 45,
    schemeType: 'Semester Scheme',
    academicYear: '1st Year',
    semester: 'I and II Semester',
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
    name: 'LL.B. III & IV Semester',
    code: 'LLB-SEM3-4',
    duration: '1 Year (Sem III & IV)',
    totalSeats: 240,
    cutoffMarks: 45,
    schemeType: 'Semester Scheme',
    academicYear: '2nd Year',
    semester: 'III and IV Semester',
    firstInstallment: 16000,
    firstInstallmentDesc: 'at the time of Semester II Exam Completion',
    secondInstallment: 8000,
    secondInstallmentDesc: 'at the time of Exam Form of III Sem',
    totalFee: 24000,
    cautionMoney: 0,
    provisionalPromotionFee: 300,
    isActive: true
  },
  {
    name: 'LL.B. IInd Year (Annual)',
    code: 'LLB-Y2',
    duration: '1 Year (Annual)',
    totalSeats: 240,
    cutoffMarks: 45,
    schemeType: 'Annual Scheme',
    academicYear: '2nd Year',
    semester: 'Annual',
    firstInstallment: 15000,
    firstInstallmentDesc: 'First Installment (Admission)',
    secondInstallment: 7500,
    secondInstallmentDesc: 'Second Installment (Exam Form)',
    totalFee: 22500,
    cautionMoney: 0,
    provisionalPromotionFee: 300,
    isActive: true
  },
  {
    name: 'LL.B. IIIrd Year (Annual)',
    code: 'LLB-Y3',
    duration: '1 Year (Annual)',
    totalSeats: 240,
    cutoffMarks: 45,
    schemeType: 'Annual Scheme',
    academicYear: '3rd Year',
    semester: 'Annual',
    firstInstallment: 15000,
    firstInstallmentDesc: 'First Installment (Admission)',
    secondInstallment: 7500,
    secondInstallmentDesc: 'Second Installment (Exam Form)',
    totalFee: 22500,
    cautionMoney: 0,
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
  },
  {
    name: 'LL.M. PART - I',
    code: 'LLM-PART1',
    duration: '1 Year (Part I)',
    totalSeats: 40,
    cutoffMarks: 50,
    schemeType: 'Post Graduate (Part - I)',
    academicYear: '1st Year',
    semester: 'Part - I',
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
    name: 'LL.M. PART - II',
    code: 'LLM-PART2',
    duration: '1 Year (Part II)',
    totalSeats: 40,
    cutoffMarks: 50,
    schemeType: 'Post Graduate (Part - II)',
    academicYear: '2nd Year',
    semester: 'Part - II',
    firstInstallment: 15500,
    firstInstallmentDesc: 'First Installment (at Admission)',
    secondInstallment: 7500,
    secondInstallmentDesc: 'Second Installment (at Exam Form)',
    totalFee: 23000,
    cautionMoney: 0,
    provisionalPromotionFee: 300,
    isActive: true
  }
];

// Helper: Seed Default Courses & Fees if empty
async function seedDefaultCoursesIfEmpty() {
  const count = await Course.count();
  if (count === 0) {
    await Course.bulkCreate(PROSPECTUS_FEE_STRUCTURES);
  }
}

// @desc    Get all courses with full fee structure
// @route   GET /api/courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    await seedDefaultCoursesIfEmpty();
    const courses = await Course.findAll({ order: [['createdAt', 'ASC'], ['name', 'ASC']] });
    res.json(courses.map(mapId));
  } catch (error) {
    console.error('[Course Route] Get all courses error:', error.message);
    res.status(500).json({ message: 'Server error retrieving courses list' });
  }
});

// @desc    Get fee structures with ancillary breakdown
// @route   GET /api/courses/fee-structures
// @access  Private
router.get('/fee-structures', protect, async (req, res) => {
  try {
    await seedDefaultCoursesIfEmpty();
    const courses = await Course.findAll({ order: [['createdAt', 'ASC']] });
    res.json({
      courses: courses.map(mapId),
      ancillary: {
        cautionMoney: 300,
        cautionMoneyDesc: 'Only for Fresh Student',
        provisionalPromotionFee: 300,
        provisionalPromotionFeeDesc: 'Registration Fee for Provisional Promotion in Next Semester (Sem II, IV, VI at Exam Form submission)'
      }
    });
  } catch (error) {
    console.error('[Course Fee-Structures] error:', error.message);
    res.status(500).json({ message: error.message || 'Error fetching fee structures' });
  }
});

// @desc    Reset Courses & Fees to Official Prospectus Default Table
// @route   POST /api/courses/reset-defaults
// @access  Private (Admin)
router.post('/reset-defaults', protect, async (req, res) => {
  try {
    for (const item of PROSPECTUS_FEE_STRUCTURES) {
      const existing = await Course.findOne({ where: { code: item.code } });
      if (existing) {
        await existing.update(item);
      } else {
        await Course.create(item);
      }
    }
    const all = await Course.findAll({ order: [['createdAt', 'ASC']] });
    res.json({ message: 'Fee structures successfully reset to official college prospectus values!', courses: all.map(mapId) });
  } catch (error) {
    console.error('[Course Reset] error:', error.message);
    res.status(500).json({ message: error.message || 'Error resetting fee structure' });
  }
});

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(mapId(course));
  } catch (error) {
    console.error('[Course Route] Get course details error:', error.message);
    res.status(500).json({ message: 'Server error retrieving course details' });
  }
});

// @desc    Create new course / class with fee structure
// @route   POST /api/courses
// @access  Private (Admin only)
router.post('/', protect, async (req, res) => {
  const { 
    name, 
    code, 
    duration, 
    totalSeats, 
    cutoffMarks, 
    reservations,
    schemeType,
    academicYear,
    semester,
    firstInstallment,
    firstInstallmentDesc,
    secondInstallment,
    secondInstallmentDesc,
    totalFee,
    cautionMoney,
    provisionalPromotionFee,
    isActive
  } = req.body;

  try {
    const cleanCode = (code || name || 'COURSE').toUpperCase().trim();
    const courseExists = await Course.findOne({ where: { code: cleanCode } });
    if (courseExists) {
      return res.status(400).json({ message: 'Course/Class with this code already exists' });
    }

    const calcTotal = Number(totalFee) || (Number(firstInstallment || 0) + Number(secondInstallment || 0));

    const createdCourse = await Course.create({
      name,
      code: cleanCode,
      duration: duration || '1 Year',
      totalSeats: Number(totalSeats) || 120,
      cutoffMarks: Number(cutoffMarks) || 45,
      reservations,
      schemeType: schemeType || 'Semester Scheme',
      academicYear: academicYear || '1st Year',
      semester: semester || 'I and II Semester',
      firstInstallment: Number(firstInstallment) || 0,
      firstInstallmentDesc: firstInstallmentDesc || 'at the time of Admission',
      secondInstallment: Number(secondInstallment) || 0,
      secondInstallmentDesc: secondInstallmentDesc || 'at the time of Exam Form',
      totalFee: calcTotal,
      cautionMoney: Number(cautionMoney) || 300,
      provisionalPromotionFee: Number(provisionalPromotionFee) || 300,
      isActive: isActive !== undefined ? Boolean(isActive) : true
    });

    res.status(201).json({ message: `Class "${name}" created successfully`, course: mapId(createdCourse) });
  } catch (error) {
    console.error('[Course Route] Create course error:', error.message);
    res.status(500).json({ message: error.message || 'Server error creating course' });
  }
});

// @desc    Update course & fee structure details
// @route   PUT /api/courses/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { 
    name, 
    code, 
    duration, 
    totalSeats, 
    cutoffMarks, 
    reservations,
    schemeType,
    academicYear,
    semester,
    firstInstallment,
    firstInstallmentDesc,
    secondInstallment,
    secondInstallmentDesc,
    totalFee,
    cautionMoney,
    provisionalPromotionFee,
    isActive
  } = req.body;

  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const calcTotal = totalFee !== undefined 
      ? Number(totalFee) 
      : ((firstInstallment !== undefined ? Number(firstInstallment) : course.firstInstallment) + 
         (secondInstallment !== undefined ? Number(secondInstallment) : course.secondInstallment));

    course.name = name !== undefined ? name : course.name;
    course.code = code ? code.toUpperCase().trim() : course.code;
    course.duration = duration !== undefined ? duration : course.duration;
    course.totalSeats = totalSeats !== undefined ? Number(totalSeats) : course.totalSeats;
    course.cutoffMarks = cutoffMarks !== undefined ? Number(cutoffMarks) : course.cutoffMarks;
    course.reservations = reservations !== undefined ? reservations : course.reservations;
    course.schemeType = schemeType !== undefined ? schemeType : course.schemeType;
    course.academicYear = academicYear !== undefined ? academicYear : course.academicYear;
    course.semester = semester !== undefined ? semester : course.semester;
    course.firstInstallment = firstInstallment !== undefined ? Number(firstInstallment) : course.firstInstallment;
    course.firstInstallmentDesc = firstInstallmentDesc !== undefined ? firstInstallmentDesc : course.firstInstallmentDesc;
    course.secondInstallment = secondInstallment !== undefined ? Number(secondInstallment) : course.secondInstallment;
    course.secondInstallmentDesc = secondInstallmentDesc !== undefined ? secondInstallmentDesc : course.secondInstallmentDesc;
    course.totalFee = calcTotal;
    course.cautionMoney = cautionMoney !== undefined ? Number(cautionMoney) : course.cautionMoney;
    course.provisionalPromotionFee = provisionalPromotionFee !== undefined ? Number(provisionalPromotionFee) : course.provisionalPromotionFee;
    course.isActive = isActive !== undefined ? Boolean(isActive) : course.isActive;

    await course.save();
    res.json({ message: `Updated ${course.name} fee structure successfully`, course: mapId(course) });
  } catch (error) {
    console.error('[Course Route] Update course error:', error.message);
    res.status(500).json({ message: error.message || 'Server error updating course' });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const deleted = await Course.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course removed successfully' });
  } catch (error) {
    console.error('[Course Route] Delete course error:', error.message);
    res.status(500).json({ message: 'Server error removing course' });
  }
});

// @desc    Get course seats stats
// @route   GET /api/courses/stats/summary
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
  try {
    const courses = await Course.findAll();
    
    const summary = await Promise.all(courses.map(async (course) => {
      const allottedCount = await Student.count({
        where: {
          courseApplied: course.code,
          seatAllotted: true
        }
      });
      return {
        _id: course.id,
        id: course.id,
        name: course.name,
        code: course.code,
        totalSeats: course.totalSeats,
        enrolled: allottedCount,
        available: course.totalSeats - allottedCount,
        cutoffMarks: course.cutoffMarks,
        reservations: course.reservations,
        firstInstallment: course.firstInstallment,
        secondInstallment: course.secondInstallment,
        totalFee: course.totalFee
      };
    }));

    res.json(summary);
  } catch (error) {
    console.error('[Course Stats Route] error:', error.message);
    res.status(500).json({ message: 'Server error calculating seats summary statistics' });
  }
});

module.exports = router;
