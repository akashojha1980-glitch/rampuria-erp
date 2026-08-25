const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Course = require('../models/Course');
const { protect } = require('../middleware/auth');

// Helper: Merit score getter
const getMeritPercentage = (student) => {
  return student.marks12 || student.marks10 || 0;
};

const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// @desc    Get Merit List by Course Code
// @route   GET /api/allotment/merit-list/:courseCode
// @access  Private
router.get('/merit-list/:courseCode', protect, async (req, res) => {
  try {
    const { courseCode } = req.params;
    const course = await Course.findOne({ where: { code: courseCode.toUpperCase() } });
    
    if (!course) {
      return res.status(404).json({ message: 'Requested course not found' });
    }

    // Get verified students who applied for this course
    const students = await Student.findAll({
      where: {
        courseApplied: course.code,
        verificationStatus: 'Verified'
      }
    });

    // Rank based on merit (12th Class percentages)
    const sortedList = students
      .map(s => {
        const studentObj = s.get({ plain: true });
        studentObj._id = studentObj.id;
        studentObj.meritPercentage = getMeritPercentage(studentObj);
        return studentObj;
      })
      .sort((a, b) => b.meritPercentage - a.meritPercentage)
      .map((student, index) => {
        student.meritRank = index + 1;
        return student;
      });

    res.json({
      course: mapId(course),
      students: sortedList,
      total: sortedList.length
    });
  } catch (error) {
    console.error('[Merit List API] error:', error.message);
    res.status(500).json({ message: 'Server error generating course merit list' });
  }
});

// @desc    Run Automated Seat Allotment Algorithm for a Course
// @route   POST /api/allotment/run/:courseCode
// @access  Private
router.post('/run/:courseCode', protect, async (req, res) => {
  try {
    const { courseCode } = req.params;
    const course = await Course.findOne({ where: { code: courseCode.toUpperCase() } });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Load verified candidates for this course who aren't already allotted
    const verifiedCandidates = await Student.findAll({
      where: {
        courseApplied: course.code,
        verificationStatus: 'Verified',
        seatAllotted: false
      }
    });

    // Sort by marks (Merit List creation)
    const meritSorted = verifiedCandidates
      .map(s => {
        const sObj = s.get({ plain: true });
        sObj._id = sObj.id;
        sObj.meritPercentage = getMeritPercentage(sObj);
        return sObj;
      })
      .filter(s => s.meritPercentage >= course.cutoffMarks) // Exclude under cutoffs
      .sort((a, b) => b.meritPercentage - a.meritPercentage);

    // Track seats and allocations
    const reservations = course.reservations || { General: course.totalSeats, OBC: 0, SC: 0, ST: 0 };
    const maxCapacity = {
      General: reservations.General || 0,
      OBC: reservations.OBC || 0,
      SC: reservations.SC || 0,
      ST: reservations.ST || 0
    };

    // Calculate currently allotted seats (excluding current run) to know vacancies
    const currentAllocations = await Student.findAll({
      where: {
        allottedCourse: course.code,
        seatAllotted: true
      }
    });
    const currentFilled = { General: 0, OBC: 0, SC: 0, ST: 0 };
    currentAllocations.forEach(a => {
      const cat = ['General', 'OBC', 'SC', 'ST'].includes(a.category) ? a.category : 'General';
      currentFilled[cat]++;
    });

    const allocatedStudents = [];
    const waitlistedStudents = [];

    // Main allotment queue loop
    for (let i = 0; i < meritSorted.length; i++) {
      const candidate = meritSorted[i];
      const category = ['General', 'OBC', 'SC', 'ST'].includes(candidate.category) ? candidate.category : 'General';

      // Check if vacancy remains in category
      if (currentFilled[category] < maxCapacity[category]) {
        currentFilled[category]++;
        
        // Update database with allotment details
        await Student.update({
          seatAllotted: true,
          allottedCourse: course.code,
          allottedOn: new Date(),
          meritRank: i + 1,
          profile: {
            enrollmentNumber: `ADM-${new Date().getFullYear()}-${course.code}-${100 + i + 1}`,
            rollNumber: `${new Date().getFullYear().toString().substring(2)}${course.code}${100 + i + 1}`
          }
        }, {
          where: { id: candidate.id }
        });

        allocatedStudents.push({ ...candidate, meritRank: i + 1 });
      } else {
        waitlistedStudents.push({ ...candidate, meritRank: i + 1 });
      }
    }

    res.json({
      message: `Automated seat allotment complete for ${course.code}`,
      allottedCount: allocatedStudents.length,
      waitlistCount: waitlistedStudents.length,
      capacityStatus: {
        total: maxCapacity,
        filled: currentFilled
      }
    });
  } catch (error) {
    console.error('[Seat Allotment Run API] error:', error.message);
    res.status(500).json({ message: 'Server error processing automated seat allocations' });
  }
});

// @desc    Run Automated Seat Allotment for ALL Courses
// @route   POST /api/allotment/run-all
// @access  Private
router.post('/run-all', protect, async (req, res) => {
  try {
    const courses = await Course.findAll();
    const report = [];

    for (const course of courses) {
      const verifiedCandidates = await Student.findAll({
        where: {
          courseApplied: course.code,
          verificationStatus: 'Verified',
          seatAllotted: false
        }
      });

      const meritSorted = verifiedCandidates
        .map(s => {
          const sObj = s.get({ plain: true });
          sObj._id = sObj.id;
          sObj.meritPercentage = getMeritPercentage(sObj);
          return sObj;
        })
        .filter(s => s.meritPercentage >= course.cutoffMarks)
        .sort((a, b) => b.meritPercentage - a.meritPercentage);

      const reservations = course.reservations || { General: course.totalSeats, OBC: 0, SC: 0, ST: 0 };
      const maxCapacity = { General: reservations.General || 0, OBC: reservations.OBC || 0, SC: reservations.SC || 0, ST: reservations.ST || 0 };

      const currentAllocations = await Student.findAll({
        where: {
          allottedCourse: course.code,
          seatAllotted: true
        }
      });
      const currentFilled = { General: 0, OBC: 0, SC: 0, ST: 0 };
      currentAllocations.forEach(a => {
        const cat = ['General', 'OBC', 'SC', 'ST'].includes(a.category) ? a.category : 'General';
        currentFilled[cat]++;
      });

      let allottedCount = 0;

      for (let i = 0; i < meritSorted.length; i++) {
        const candidate = meritSorted[i];
        const category = ['General', 'OBC', 'SC', 'ST'].includes(candidate.category) ? candidate.category : 'General';

        if (currentFilled[category] < maxCapacity[category]) {
          currentFilled[category]++;
          allottedCount++;
          
          await Student.update({
            seatAllotted: true,
            allottedCourse: course.code,
            allottedOn: new Date(),
            meritRank: i + 1,
            profile: {
              enrollmentNumber: `ADM-${new Date().getFullYear()}-${course.code}-${100 + i + 1}`,
              rollNumber: `${new Date().getFullYear().toString().substring(2)}${course.code}${100 + i + 1}`
            }
          }, {
            where: { id: candidate.id }
          });
        }
      }

      report.push({
        course: course.code,
        allotted: allottedCount,
        capacity: course.totalSeats
      });
    }

    res.json({
      message: 'Automated seat allotment complete for all college courses.',
      report
    });
  } catch (error) {
    console.error('[Seat Allotment Run All API] error:', error.message);
    res.status(500).json({ message: 'Server error processing college-wide allocations' });
  }
});

// @desc    Get Allotted Seats Results Summary
// @route   GET /api/allotment/results
// @access  Private
router.get('/results', protect, async (req, res) => {
  try {
    const allottedStudents = await Student.findAll({
      where: {
        seatAllotted: true
      },
      order: [['allottedOn', 'DESC']]
    });
    const courses = await Course.findAll();

    const summaryReport = courses.map(c => {
      const allottedCount = allottedStudents.filter(s => s.allottedCourse === c.code).length;
      return {
        code: c.code,
        name: c.name,
        totalSeats: c.totalSeats,
        allotted: allottedCount,
        available: c.totalSeats - allottedCount
      };
    });

    res.json({
      allottedStudents: allottedStudents.map(mapId),
      summaryReport
    });
  } catch (error) {
    console.error('[Seat Allotment Results API] error:', error.message);
    res.status(500).json({ message: 'Server error generating allotment reports' });
  }
});

// @desc    Reset seat allotment status for a Course
// @route   DELETE /api/allotment/reset/:courseCode
// @access  Private
router.delete('/reset/:courseCode', protect, async (req, res) => {
  try {
    const { courseCode } = req.params;
    
    const [affectedCount] = await Student.update({
      seatAllotted: false,
      allottedCourse: null,
      allottedOn: null,
      meritRank: null,
      profile: '{}'
    }, {
      where: {
        allottedCourse: courseCode.toUpperCase()
      }
    });

    res.json({
      message: `Successfully reset seat allotment parameters for ${courseCode.toUpperCase()}`,
      matchedCount: affectedCount,
      modifiedCount: affectedCount
    });
  } catch (error) {
    console.error('[Seat Allotment Reset API] error:', error.message);
    res.status(500).json({ message: 'Server error resetting course allotments' });
  }
});

module.exports = router;
