const express = require('express');
const router = express.Router();
const AcademicSession = require('../models/AcademicSession');
const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');
const { protect } = require('../middleware/auth');

// @desc    Get all academic sessions
// @route   GET /api/sessions
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let sessions = await AcademicSession.findAll({
      order: [['sessionName', 'ASC']]
    });

    // If empty, return standard default list
    if (!sessions || sessions.length === 0) {
      sessions = [
        { id: 's1', sessionName: '2024-25', isActive: false },
        { id: 's2', sessionName: '2025-26', isActive: true },
        { id: 's3', sessionName: '2026-27', isActive: false }
      ];
    }

    res.json(sessions);
  } catch (error) {
    console.error('[Sessions List] Error:', error.message);
    res.status(500).json({ message: error.message || 'Error fetching academic sessions' });
  }
});

// @desc    Create a new academic session
// @route   POST /api/sessions
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { sessionName, isActive } = req.body;

    if (!sessionName) {
      return res.status(400).json({ message: 'Session name is required (e.g. 2026-27)' });
    }

    const exists = await AcademicSession.findOne({ where: { sessionName } });
    if (exists) {
      return res.status(400).json({ message: 'Academic session already exists' });
    }

    if (isActive) {
      await AcademicSession.update({ isActive: false }, { where: {} });
    }

    const newSession = await AcademicSession.create({
      sessionName,
      isActive: Boolean(isActive)
    });

    res.status(201).json({ message: 'Academic session created successfully', session: newSession });
  } catch (error) {
    console.error('[Session Create] Error:', error.message);
    res.status(500).json({ message: error.message || 'Error creating academic session' });
  }
});

// @desc    Activate a session
// @route   PUT /api/sessions/:id/activate
// @access  Private
router.get('/:id/activate', protect, async (req, res) => {
  try {
    const { id } = req.params;
    await AcademicSession.update({ isActive: false }, { where: {} });
    await AcademicSession.update({ isActive: true }, { where: { id } });

    res.json({ message: 'Session activated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    1-Click Bulk Student Promotion
// @route   POST /api/sessions/promote
// @access  Private
router.post('/promote', protect, async (req, res) => {
  try {
    const { studentIds, targetSession, targetCourse, targetYear, enforceFeeClearance = true, allowPendingFees = false } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one student to promote' });
    }

    if (!targetSession) {
      return res.status(400).json({ message: 'Target Academic Session is required' });
    }

    // Fee Clearance Validation Rule
    if (enforceFeeClearance && !allowPendingFees) {
      const pendingDueStudents = [];

      for (const stId of studentIds) {
        const student = await Student.findByPk(stId);
        if (!student) continue;

        const payments = await FeePayment.findAll({ where: { studentId: stId } });
        const totalDue = payments.reduce((acc, p) => acc + (Number(p.amountDue) || 0), 0);
        
        if (totalDue > 0) {
          pendingDueStudents.push(`${student.fullName} (Pending Due: ₹${totalDue})`);
        }
      }

      if (pendingDueStudents.length > 0) {
        return res.status(400).json({
          message: `Fees Validation Failed: ${pendingDueStudents.length} student(s) have pending fees dues. Promotion is restricted until fees are cleared.`,
          pendingStudents: pendingDueStudents
        });
      }
    }

    const updateFields = {
      academicSession: targetSession
    };

    if (targetCourse) {
      updateFields.courseApplied = targetCourse;
      updateFields.allottedCourse = targetCourse;
    }

    if (targetYear) {
      updateFields.currentYear = targetYear;
    }

    // Perform Bulk Update
    const [updatedCount] = await Student.update(updateFields, {
      where: {
        id: studentIds
      }
    });

    res.json({
      message: `Successfully promoted ${updatedCount} students to Session ${targetSession}!`,
      promotedCount: updatedCount,
      targetSession
    });
  } catch (error) {
    console.error('[Student Promote] Error:', error.message);
    res.status(500).json({ message: error.message || 'Error promoting students' });
  }
});

module.exports = router;
