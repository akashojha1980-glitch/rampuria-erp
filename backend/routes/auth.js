const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check for admin
    const admin = await Admin.findOne({ where: { username } });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: admin.id },
      process.env.JWT_SECRET || 'nct_college_erp_local_desktop_secret_2026',
      { expiresIn: '30d' }
    );

    let permissionsArray = [];
    try {
      permissionsArray = JSON.parse(admin.permissions || '[]');
    } catch (e) {
      permissionsArray = [];
    }

    res.json({
      _id: admin.id,
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role || 'Staff',
      permissions: permissionsArray,
      token
    });
  } catch (error) {
    console.error('[Auth Route] Login error:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    if (!req.admin) return res.status(404).json({ message: 'Admin not found' });
    const adminObj = req.admin.get({ plain: true });
    adminObj._id = adminObj.id;
    try {
      adminObj.permissions = JSON.parse(adminObj.permissions || '[]');
    } catch (e) {
      adminObj.permissions = [];
    }
    res.json(adminObj);
  } catch (error) {
    console.error('[Auth Route] Fetch admin error:', error.message);
    res.status(500).json({ message: 'Server error fetching admin profile' });
  }
});

// @route   GET /api/auth/users
// @access  Private (SuperAdmin Only)
router.get('/users', protect, async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden. Access restricted to Super Admin.' });
    }
    const users = await Admin.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    const formattedUsers = users.map(user => {
      const u = user.get({ plain: true });
      u._id = u.id;
      try {
        u.permissions = JSON.parse(u.permissions || '[]');
      } catch (e) {
        u.permissions = [];
      }
      return u;
    });

    res.json(formattedUsers);
  } catch (err) {
    console.error('[Auth Route] Fetch users error:', err.message);
    res.status(500).json({ message: 'Server error fetching staff members' });
  }
});

// @route   POST /api/auth/users
// @access  Private (SuperAdmin Only)
router.post('/users', protect, async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden. Access restricted to Super Admin.' });
    }
    const { username, password, name, permissions } = req.body;

    const existingUser = await Admin.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    const newUser = await Admin.create({
      username,
      password,
      name,
      role: 'Staff',
      permissions: JSON.stringify(permissions || [])
    });

    const userObj = newUser.get({ plain: true });
    delete userObj.password;
    userObj._id = userObj.id;
    userObj.permissions = permissions || [];

    res.status(201).json(userObj);
  } catch (err) {
    console.error('[Auth Route] Create user error:', err.message);
    res.status(500).json({ message: 'Server error creating staff account' });
  }
});

// @route   PUT /api/auth/users/:id
// @access  Private (SuperAdmin Only)
router.put('/users/:id', protect, async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden. Access restricted to Super Admin.' });
    }
    const { name, password, permissions } = req.body;
    const user = await Admin.findByPk(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.name = name || user.name;
    if (permissions) {
      if (user.username === 'admin') {
        user.permissions = JSON.stringify(['dashboard', 'registration', 'verification', 'fees', 'library']);
      } else {
        user.permissions = JSON.stringify(permissions);
      }
    }
    if (password && password.trim() !== '') {
      user.password = password;
    }

    await user.save();

    const userObj = user.get({ plain: true });
    delete userObj.password;
    userObj._id = userObj.id;
    try {
      userObj.permissions = JSON.parse(userObj.permissions || '[]');
    } catch (e) {
      userObj.permissions = [];
    }

    res.json(userObj);
  } catch (err) {
    console.error('[Auth Route] Update user error:', err.message);
    res.status(500).json({ message: 'Server error updating staff account' });
  }
});

// @route   DELETE /api/auth/users/:id
// @access  Private (SuperAdmin Only)
router.delete('/users/:id', protect, async (req, res) => {
  try {
    if (req.admin.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden. Access restricted to Super Admin.' });
    }

    if (req.params.id === req.admin.id) {
      return res.status(400).json({ message: 'Cannot delete your own administrator account' });
    }

    const user = await Admin.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.username === 'admin') {
      return res.status(400).json({ message: 'Cannot delete the primary default admin account' });
    }

    await user.destroy();
    res.json({ message: 'Staff account deleted successfully' });
  } catch (err) {
    console.error('[Auth Route] Delete user error:', err.message);
    res.status(500).json({ message: 'Server error deleting staff account' });
  }
});

module.exports = router;
