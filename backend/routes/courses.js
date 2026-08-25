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

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const courses = await Course.findAll({ order: [['name', 'ASC']] });
    res.json(courses.map(mapId));
  } catch (error) {
    console.error('[Course Route] Get all courses error:', error.message);
    res.status(500).json({ message: 'Server error retrieving courses list' });
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

// @desc    Create new course
// @route   POST /api/courses
// @access  Private (Admin only)
router.post('/', protect, async (req, res) => {
  const { name, code, duration, totalSeats, cutoffMarks, reservations } = req.body;

  try {
    const courseExists = await Course.findOne({ where: { code: code.toUpperCase() } });
    if (courseExists) {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }

    const createdCourse = await Course.create({
      name,
      code: code.toUpperCase(),
      duration,
      totalSeats,
      cutoffMarks,
      reservations
    });

    res.status(201).json(mapId(createdCourse));
  } catch (error) {
    console.error('[Course Route] Create course error:', error.message);
    res.status(500).json({ message: 'Server error creating course' });
  }
});

// @desc    Update course details
// @route   PUT /api/courses/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { name, code, duration, totalSeats, cutoffMarks, reservations } = req.body;

  try {
    const course = await Course.findByPk(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.name = name || course.name;
    course.code = code ? code.toUpperCase() : course.code;
    course.duration = duration || course.duration;
    course.totalSeats = totalSeats || course.totalSeats;
    course.cutoffMarks = cutoffMarks || course.cutoffMarks;
    course.reservations = reservations || course.reservations;

    await course.save();
    res.json(mapId(course));
  } catch (error) {
    console.error('[Course Route] Update course error:', error.message);
    res.status(500).json({ message: 'Server error updating course specifications' });
  }
});

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private
router.get('/delete/:id', protect, async (req, res) => { // fallback route if DELETE is blocked
  try {
    const deleted = await Course.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Course not found' });
    res.json({ message: 'Course removed successfully' });
  } catch (error) {
    console.error('[Course Route] Delete course error:', error.message);
    res.status(500).json({ message: 'Server error removing course' });
  }
});

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
        reservations: course.reservations
      };
    }));

    res.json(summary);
  } catch (error) {
    console.error('[Course Stats Route] error:', error.message);
    res.status(500).json({ message: 'Server error calculating seats summary statistics' });
  }
});

module.exports = router;
