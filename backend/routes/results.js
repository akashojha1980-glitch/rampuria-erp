const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Result = require('../models/Result');
const Student = require('../models/Student');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// Course standard subject templates
const COURSE_SUBJECT_TEMPLATES = {
  'LLB': [
    { code: 'LLB-101', name: 'Jurisprudence (Legal Theory)', maxMarks: 100, minMarks: 36 },
    { code: 'LLB-102', name: 'Law of Contract - I', maxMarks: 100, minMarks: 36 },
    { code: 'LLB-103', name: 'Constitutional Law of India - I', maxMarks: 100, minMarks: 36 },
    { code: 'LLB-104', name: 'Law of Torts & Consumer Protection', maxMarks: 100, minMarks: 36 },
    { code: 'LLB-105', name: 'Family Law - I (Hindu Law)', maxMarks: 100, minMarks: 36 }
  ],
  'BALLB': [
    { code: 'BALLB-101', name: 'General English & Legal Language', maxMarks: 100, minMarks: 36 },
    { code: 'BALLB-102', name: 'Political Science - I', maxMarks: 100, minMarks: 36 },
    { code: 'BALLB-103', name: 'Sociology - I', maxMarks: 100, minMarks: 36 },
    { code: 'BALLB-104', name: 'Law of Torts', maxMarks: 100, minMarks: 36 },
    { code: 'BALLB-105', name: 'Constitutional History of India', maxMarks: 100, minMarks: 36 }
  ],
  'BCA': [
    { code: 'BCA-101', name: 'Problem Solving through C Programming', maxMarks: 100, minMarks: 36 },
    { code: 'BCA-102', name: 'Computer Fundamentals & IT', maxMarks: 100, minMarks: 36 },
    { code: 'BCA-103', name: 'Discrete Mathematics', maxMarks: 100, minMarks: 36 },
    { code: 'BCA-104', name: 'Digital Electronics', maxMarks: 100, minMarks: 36 },
    { code: 'BCA-105', name: 'C Programming Lab Practicals', maxMarks: 100, minMarks: 36 }
  ],
  'BBA': [
    { code: 'BBA-101', name: 'Principles & Practice of Management', maxMarks: 100, minMarks: 36 },
    { code: 'BBA-102', name: 'Business Economics', maxMarks: 100, minMarks: 36 },
    { code: 'BBA-103', name: 'Financial Accounting', maxMarks: 100, minMarks: 36 },
    { code: 'BBA-104', name: 'Business Communication', maxMarks: 100, minMarks: 36 },
    { code: 'BBA-105', name: 'Computer Applications in Business', maxMarks: 100, minMarks: 36 }
  ],
  'BSC_CS': [
    { code: 'BSC-101', name: 'Computer Organization & Architecture', maxMarks: 100, minMarks: 36 },
    { code: 'BSC-102', name: 'Data Structures with C++', maxMarks: 100, minMarks: 36 },
    { code: 'BSC-103', name: 'Mathematics - Calculus & Algebra', maxMarks: 100, minMarks: 36 },
    { code: 'BSC-104', name: 'Physics / Statistics', maxMarks: 100, minMarks: 36 },
    { code: 'BSC-105', name: 'Programming Lab', maxMarks: 100, minMarks: 36 }
  ],
  'BCOM': [
    { code: 'BCOM-101', name: 'Financial & Corporate Accounting', maxMarks: 100, minMarks: 36 },
    { code: 'BCOM-102', name: 'Business Law & Corporate Governance', maxMarks: 100, minMarks: 36 },
    { code: 'BCOM-103', name: 'Business Statistics', maxMarks: 100, minMarks: 36 },
    { code: 'BCOM-104', name: 'Micro Economics', maxMarks: 100, minMarks: 36 },
    { code: 'BCOM-105', name: 'Banking & Financial Systems', maxMarks: 100, minMarks: 36 }
  ]
};

// @desc    Get Subject Template by Course
// @route   GET /api/results/template/subjects
// @access  Private
router.get('/template/subjects', protect, async (req, res) => {
  const { course } = req.query;
  const normalized = (course || 'LLB').toUpperCase().replace(/[^A-Z]/g, '');
  const template = COURSE_SUBJECT_TEMPLATES[normalized] || COURSE_SUBJECT_TEMPLATES['LLB'];
  res.json(template);
});

// @desc    Get All Results with Filters & Stats
// @route   GET /api/results
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { search, session, course, year, resultStatus, page = 1, limit = 50 } = req.query;
    const where = {};

    if (session && session !== 'all' && session !== 'All Sessions') {
      where.academicSession = session;
    }

    if (course && course !== 'all') {
      where.course = course;
    }

    if (year && year !== 'all') {
      where.year = year;
    }

    if (resultStatus && resultStatus !== 'all') {
      where.resultStatus = resultStatus;
    }

    if (search) {
      where[Op.or] = [
        { studentName: { [Op.like]: `%${search}%` } },
        { rollNo: { [Op.like]: `%${search}%` } },
        { registrationId: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows: results } = await Result.findAndCountAll({
      where,
      limit: Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      order: [['declaredDate', 'DESC'], ['percentage', 'DESC']]
    });

    // Compute Quick Summary for the active filter
    const totalCount = await Result.count({ where });
    const passCount = await Result.count({ where: { ...where, resultStatus: 'Pass' } });
    const failCount = await Result.count({ where: { ...where, resultStatus: 'Fail' } });
    const suppCount = await Result.count({ where: { ...where, resultStatus: 'Supplementary' } });
    const firstDivCount = await Result.count({ where: { ...where, division: 'First Division' } });

    res.json({
      results: results.map(mapId),
      total: count,
      page: Number(page),
      pages: Math.ceil(count / Number(limit)),
      stats: {
        totalDeclared: totalCount,
        passed: passCount,
        failed: failCount,
        supplementary: suppCount,
        firstDivision: firstDivCount,
        passPercentage: totalCount > 0 ? Number(((passCount / totalCount) * 100).toFixed(1)) : 0
      }
    });
  } catch (error) {
    console.error('[Results List] Error:', error.message);
    res.status(500).json({ message: error.message || 'Error fetching exam results' });
  }
});

// @desc    Get Single Result Detail / Marksheet
// @route   GET /api/results/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'Result / Marksheet record not found' });
    }
    res.json(mapId(result));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get Students for a Class / Semester Batch Marks Entry
// @route   GET /api/results/class-students
// @access  Private
router.get('/class-students', protect, async (req, res) => {
  try {
    const { session, course, year } = req.query;
    const where = {};
    if (session && session !== 'all' && session !== 'All Sessions') {
      where.academicSession = session;
    }
    if (course && course !== 'all') {
      where.courseApplied = course;
    }
    if (year && year !== 'all') {
      where.currentYear = year;
    }

    const students = await Student.findAll({
      where,
      order: [['fullName', 'ASC']]
    });

    // Check existing results for these students
    const studentListWithResults = await Promise.all(students.map(async (st) => {
      const studentObj = mapId(st);
      const existingResult = await Result.findOne({
        where: {
          [Op.or]: [
            { studentId: st.id },
            { registrationId: st.registrationId }
          ],
          academicSession: session && session !== 'All Sessions' ? session : (st.academicSession || '2025-26'),
          year: year && year !== 'all' ? year : (st.currentYear || '1st Year')
        }
      });

      studentObj.existingResult = existingResult ? mapId(existingResult) : null;
      return studentObj;
    }));

    res.json(studentListWithResults);
  } catch (error) {
    console.error('[Results Class-Students] Error:', error.message);
    res.status(500).json({ message: error.message || 'Error loading class student roster' });
  }
});

// @desc    Enter New Marksheet / Result (Supports Subject-Wise or Quick Total Marks)
// @route   POST /api/results
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const data = req.body;

    if (!data.studentName || !data.rollNo || !data.course) {
      return res.status(400).json({ message: 'Student Name, Roll No and Course are required' });
    }

    let totalMax = Number(data.totalMaxMarks) || 500;
    let totalObtained = Number(data.totalObtainedMarks) || 0;
    let percentage = 0;
    let resultStatus = data.resultStatus || 'Pass';
    let division = data.division || 'Pass Class';
    let processedSubjects = [];

    // Mode A: Subject-wise Marks Entry
    if (Array.isArray(data.subjects) && data.subjects.length > 0 && data.entryMode !== 'quick') {
      totalMax = 0;
      totalObtained = 0;
      let failedSubjectsCount = 0;

      processedSubjects = data.subjects.map(s => {
        const max = Number(s.maxMarks) || 100;
        const min = Number(s.minMarks) || 36;
        const theory = Number(s.theoryMarks) || 0;
        const practical = Number(s.practicalMarks) || 0;
        const total = theory + practical;
        const passed = total >= min;
        if (!passed) failedSubjectsCount++;

        totalMax += max;
        totalObtained += total;

        return {
          code: s.code || '',
          name: s.name || '',
          maxMarks: max,
          minMarks: min,
          theoryMarks: theory,
          practicalMarks: practical,
          totalMarks: total,
          status: passed ? 'Pass' : 'Fail'
        };
      });

      if (totalMax === 0) totalMax = Number(data.totalMaxMarks) || 500;
      percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;

      if (failedSubjectsCount > 2) {
        resultStatus = 'Fail';
        division = 'Fail';
      } else if (failedSubjectsCount > 0) {
        resultStatus = 'Supplementary';
        division = 'Supplementary';
      } else {
        if (percentage >= 60) division = 'First Division (Honours)';
        else if (percentage >= 48) division = 'Second Division';
        else division = 'Pass Class';
      }
    } else {
      // Mode B: Quick Total Marks Mode
      totalMax = Number(data.totalMaxMarks) || 500;
      totalObtained = Number(data.totalObtainedMarks) || 0;
      percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      
      if (percentage < 36) {
        resultStatus = 'Fail';
        division = 'Fail';
      } else if (percentage >= 60) {
        resultStatus = 'Pass';
        division = 'First Division';
      } else if (percentage >= 48) {
        resultStatus = 'Pass';
        division = 'Second Division';
      } else {
        resultStatus = 'Pass';
        division = 'Pass Class';
      }
    }

    // Check if result already exists for rollNo/regId & session to update or create
    const existing = await Result.findOne({
      where: {
        rollNo: data.rollNo,
        academicSession: data.academicSession || '2025-26',
        year: data.year || '1st Year'
      }
    });

    let resultRecord;
    if (existing) {
      resultRecord = await existing.update({
        studentName: data.studentName,
        fatherName: data.fatherName || existing.fatherName,
        course: data.course,
        semester: data.semester || existing.semester,
        examType: data.examType || existing.examType,
        examMonthYear: data.examMonthYear || existing.examMonthYear,
        subjects: processedSubjects,
        totalMaxMarks: totalMax,
        totalObtainedMarks: totalObtained,
        percentage,
        resultStatus,
        division,
        remarks: data.remarks || existing.remarks,
        declaredDate: data.declaredDate || existing.declaredDate
      });
    } else {
      resultRecord = await Result.create({
        studentId: data.studentId || null,
        registrationId: data.registrationId || `REG-${Date.now().toString().slice(-5)}`,
        rollNo: data.rollNo,
        studentName: data.studentName,
        fatherName: data.fatherName || '',
        course: data.course,
        academicSession: data.academicSession || '2025-26',
        year: data.year || '1st Year',
        semester: data.semester || 'Annual',
        examType: data.examType || 'Main Annual Exam',
        examMonthYear: data.examMonthYear || 'May 2026',
        subjects: processedSubjects,
        totalMaxMarks: totalMax,
        totalObtainedMarks: totalObtained,
        percentage,
        resultStatus,
        division,
        remarks: data.remarks || '',
        declaredDate: data.declaredDate || new Date().toISOString().split('T')[0]
      });
    }

    res.status(201).json({
      message: 'Marksheet saved & calculated successfully',
      result: mapId(resultRecord)
    });
  } catch (error) {
    console.error('[Result Create] Error:', error.message);
    res.status(500).json({ message: error.message || 'Error saving result' });
  }
});

// @desc    Batch Save Class Marks (1-Click for entire semester/year)
// @route   POST /api/results/batch-save
// @access  Private
router.post('/batch-save', protect, async (req, res) => {
  try {
    const { session, course, year, semester, examType, examMonthYear, records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'No student marks records provided' });
    }

    let savedCount = 0;
    for (const r of records) {
      if (!r.studentName || !r.rollNo) continue;

      const totalMax = Number(r.totalMaxMarks) || 500;
      const totalObtained = Number(r.totalObtainedMarks) || 0;
      const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(2)) : 0;
      
      let resultStatus = 'Pass';
      let division = 'Pass Class';
      if (percentage < 36) {
        resultStatus = 'Fail';
        division = 'Fail';
      } else if (percentage >= 60) {
        resultStatus = 'Pass';
        division = 'First Division';
      } else if (percentage >= 48) {
        resultStatus = 'Pass';
        division = 'Second Division';
      }

      const existing = await Result.findOne({
        where: {
          rollNo: r.rollNo,
          academicSession: session || '2025-26',
          year: year || '1st Year'
        }
      });

      if (existing) {
        await existing.update({
          studentName: r.studentName,
          fatherName: r.fatherName || existing.fatherName,
          course: course || existing.course,
          semester: semester || 'Annual',
          examType: examType || 'Main Annual Exam',
          examMonthYear: examMonthYear || 'May 2026',
          totalMaxMarks: totalMax,
          totalObtainedMarks: totalObtained,
          percentage,
          resultStatus,
          division
        });
      } else {
        await Result.create({
          studentId: r.studentId || null,
          registrationId: r.registrationId || `REG-${Date.now().toString().slice(-5)}`,
          rollNo: r.rollNo,
          studentName: r.studentName,
          fatherName: r.fatherName || '',
          course: course || 'LLB',
          academicSession: session || '2025-26',
          year: year || '1st Year',
          semester: semester || 'Annual',
          examType: examType || 'Main Annual Exam',
          examMonthYear: examMonthYear || 'May 2026',
          subjects: [],
          totalMaxMarks: totalMax,
          totalObtainedMarks: totalObtained,
          percentage,
          resultStatus,
          division,
          declaredDate: new Date().toISOString().split('T')[0]
        });
      }
      savedCount++;
    }

    res.json({ message: `Successfully saved examination marks for ${savedCount} students!`, count: savedCount });
  } catch (error) {
    console.error('[Batch Results Save] Error:', error.message);
    res.status(500).json({ message: error.message || 'Error processing batch marks' });
  }
});

// @desc    Delete Result
// @route   DELETE /api/results/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id);
    if (!result) return res.status(404).json({ message: 'Result not found' });
    await result.destroy();
    res.json({ message: 'Result record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Auto Seed / Generate Demo Results for existing students if empty
// @route   POST /api/results/seed-demo
// @access  Private
router.post('/seed-demo', protect, async (req, res) => {
  try {
    const count = await Result.count();
    if (count > 0) {
      return res.json({ message: 'Results already exist in database', count });
    }

    const students = await Student.findAll({ limit: 15 });
    if (students.length === 0) {
      return res.status(400).json({ message: 'No registered students found to create marks' });
    }

    const sampleResults = [];
    let rollCounter = 10101;

    for (const st of students) {
      const normalized = (st.courseApplied || 'LLB').toUpperCase().replace(/[^A-Z]/g, '');
      const template = COURSE_SUBJECT_TEMPLATES[normalized] || COURSE_SUBJECT_TEMPLATES['LLB'];

      let totalMax = 0;
      let totalObtained = 0;

      const subjects = template.map(s => {
        const theory = Math.floor(45 + Math.random() * 45); // 45 to 90
        const practical = 0;
        const total = theory + practical;
        totalMax += s.maxMarks;
        totalObtained += total;
        return {
          code: s.code,
          name: s.name,
          maxMarks: s.maxMarks,
          minMarks: s.minMarks,
          theoryMarks: theory,
          practicalMarks: practical,
          totalMarks: total,
          status: 'Pass'
        };
      });

      const percentage = Number(((totalObtained / totalMax) * 100).toFixed(2));
      const division = percentage >= 60 ? 'First Division' : percentage >= 48 ? 'Second Division' : 'Pass Class';

      sampleResults.push({
        studentId: st.id,
        registrationId: st.registrationId,
        rollNo: String(rollCounter++),
        studentName: st.fullName,
        fatherName: st.fatherName || '',
        course: st.courseApplied || 'LLB',
        academicSession: st.academicSession || '2025-26',
        year: st.currentYear || '1st Year',
        semester: 'Annual',
        examType: 'Main Annual Exam',
        examMonthYear: 'May 2026',
        subjects,
        totalMaxMarks: totalMax,
        totalObtainedMarks: totalObtained,
        percentage,
        resultStatus: 'Pass',
        division,
        declaredDate: new Date().toISOString().split('T')[0]
      });
    }

    await Result.bulkCreate(sampleResults);
    res.json({ message: `Successfully generated ${sampleResults.length} marksheet results!`, count: sampleResults.length });
  } catch (error) {
    console.error('[Results Seed] Error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
