const express = require('express');
const router = express.Router();
const DocSetting = require('../models/DocSetting');
const { protect } = require('../middleware/auth');

const mapId = (instance) => {
  if (!instance) return null;
  const obj = typeof instance.get === 'function' ? instance.get({ plain: true }) : instance;
  obj._id = obj.id;
  return obj;
};

// Default Initial Document Checklist (Only Photo & Signature ON by default, others OFF)
const DEFAULT_DOCUMENTS = [
  { key: 'photo', label: 'Passport Size Photograph', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 1 },
  { key: 'signature', label: 'Candidate Signature', isEnabled: true, isRequired: true, isCustom: false, displayOrder: 2 },
  { key: 'marksheet10', label: '10th Secondary Marksheet', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 3 },
  { key: 'marksheet12', label: '12th Sr. Secondary Marksheet', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 4 },
  { key: 'graduationMarksheet', label: 'Graduation / Qualifying Marksheet', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 5 },
  { key: 'casteCertificate', label: 'Caste Certificate (SC/ST/OBC/EWS)', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 6 },
  { key: 'aadharCard', label: 'Aadhar Card / Identity Proof', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 7 },
  { key: 'domicileCertificate', label: 'Domicile / Residence Certificate', isEnabled: false, isRequired: false, isCustom: false, displayOrder: 8 }
];

// Helper: Seed Default Documents if empty
async function seedDefaultDocSettingsIfEmpty() {
  const count = await DocSetting.count();
  if (count === 0) {
    await DocSetting.bulkCreate(DEFAULT_DOCUMENTS);
  }
}

// @desc    Get all document settings (both active and disabled)
// @route   GET /api/settings/documents
// @access  Private
router.get('/documents', protect, async (req, res) => {
  try {
    await seedDefaultDocSettingsIfEmpty();

    const docs = await DocSetting.findAll({
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
    });

    res.json(docs.map(mapId));
  } catch (error) {
    console.error('[Doc Settings] Get error:', error.message);
    res.status(500).json({ message: error.message || 'Error fetching document settings' });
  }
});

// @desc    Toggle document enabled / required status
// @route   PUT /api/settings/documents/:key/toggle
// @access  Private
router.put('/documents/:key/toggle', protect, async (req, res) => {
  try {
    const { key } = req.params;
    const { isEnabled, isRequired } = req.body;

    const doc = await DocSetting.findOne({ where: { key } });
    if (!doc) {
      return res.status(404).json({ message: 'Document requirement setting not found' });
    }

    const updates = {};
    if (typeof isEnabled === 'boolean') updates.isEnabled = isEnabled;
    if (typeof isRequired === 'boolean') updates.isRequired = isRequired;

    await doc.update(updates);
    res.json({ message: `Updated ${doc.label} settings successfully`, doc: mapId(doc) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Add a new custom document requirement
// @route   POST /api/settings/documents
// @access  Private
router.post('/documents', protect, async (req, res) => {
  try {
    const { label, isEnabled = true, isRequired = false } = req.body;

    if (!label || !label.trim()) {
      return res.status(400).json({ message: 'Document label is required (e.g. Transfer Certificate)' });
    }

    const cleanKey = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30);
    const existing = await DocSetting.findOne({ where: { key: cleanKey } });
    if (existing) {
      return res.status(400).json({ message: 'A document setting with this name already exists' });
    }

    const maxOrder = await DocSetting.max('displayOrder') || 10;

    const newDoc = await DocSetting.create({
      key: cleanKey,
      label: label.trim(),
      isEnabled: Boolean(isEnabled),
      isRequired: Boolean(isRequired),
      isCustom: true,
      displayOrder: maxOrder + 1
    });

    res.status(201).json({ message: `Added custom document requirement "${label}"`, doc: mapId(newDoc) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete custom document requirement
// @route   DELETE /api/settings/documents/:key
// @access  Private
router.delete('/documents/:key', protect, async (req, res) => {
  try {
    const { key } = req.params;
    const doc = await DocSetting.findOne({ where: { key } });
    if (!doc) {
      return res.status(404).json({ message: 'Document setting not found' });
    }

    if (!doc.isCustom) {
      return res.status(400).json({ message: 'Cannot delete core system documents. You can toggle them OFF instead.' });
    }

    await doc.destroy();
    res.json({ message: `Deleted custom document "${doc.label}"` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ─── REGISTRATION NUMBER SEQUENCE SETTINGS ───
const AppSetting = require('../models/AppSetting');
const Student = require('../models/Student');

const DEFAULT_REG_CONFIG = {
  prefix: 'BJS/',
  suffix: '',
  startNumber: 1001,
  currentNumber: 1001,
  padding: 4,
  includeYear: false,
  includeSession: false
};

// Helper to get or initialize registration config
async function getRegConfig() {
  const setting = await AppSetting.findOne({ where: { key: 'reg_number_config' } });
  if (!setting) {
    await AppSetting.create({
      key: 'reg_number_config',
      value: JSON.stringify(DEFAULT_REG_CONFIG),
      description: 'Registration Number generation format and counter sequence'
    });
    return { ...DEFAULT_REG_CONFIG };
  }
  try {
    return { ...DEFAULT_REG_CONFIG, ...JSON.parse(setting.value) };
  } catch {
    return { ...DEFAULT_REG_CONFIG };
  }
}

// Format a number with prefix/padding
function formatRegId(number, config, session) {
  const padded = String(number).padStart(config.padding || 4, '0');
  let result = config.prefix || '';
  if (config.includeSession && session) {
    result += `${session}/`;
  }
  if (config.includeYear) {
    result += `${new Date().getFullYear()}/`;
  }
  result += padded;
  if (config.suffix) {
    result += config.suffix;
  }
  return result;
}

// @desc    Get Registration Number Settings & Preview
// @route   GET /api/settings/reg-number
// @access  Private
router.get('/reg-number', protect, async (req, res) => {
  try {
    const config = await getRegConfig();
    const nextPreview = formatRegId(config.currentNumber, config, '2025-26');
    const totalStudents = await Student.count();

    res.json({
      config,
      nextPreview,
      totalStudents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Update Registration Number Settings
// @route   PUT /api/settings/reg-number
// @access  Private
router.put('/reg-number', protect, async (req, res) => {
  try {
    const { prefix, suffix, startNumber, currentNumber, padding, includeYear, includeSession } = req.body;
    const current = await getRegConfig();

    const updated = {
      prefix: prefix !== undefined ? prefix : current.prefix,
      suffix: suffix !== undefined ? suffix : current.suffix,
      startNumber: startNumber !== undefined ? Number(startNumber) : current.startNumber,
      currentNumber: currentNumber !== undefined ? Number(currentNumber) : current.currentNumber,
      padding: padding !== undefined ? Number(padding) : current.padding,
      includeYear: Boolean(includeYear),
      includeSession: Boolean(includeSession)
    };

    let setting = await AppSetting.findOne({ where: { key: 'reg_number_config' } });
    if (!setting) {
      setting = await AppSetting.create({
        key: 'reg_number_config',
        value: JSON.stringify(updated),
        description: 'Registration Number format settings'
      });
    } else {
      await setting.update({ value: JSON.stringify(updated) });
    }

    res.json({
      message: 'Registration number settings updated successfully',
      config: updated,
      nextPreview: formatRegId(updated.currentNumber, updated, '2025-26')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Renumber existing students sequentially according to custom config
// @route   POST /api/settings/reg-number/renumber-existing
// @access  Private
router.post('/reg-number/renumber-existing', protect, async (req, res) => {
  try {
    const config = await getRegConfig();
    let counter = config.startNumber;

    const students = await Student.findAll({
      order: [['createdAt', 'ASC'], ['id', 'ASC']]
    });

    for (const student of students) {
      const regId = formatRegId(counter, config, student.academicSession);
      await student.update({ registrationId: regId });
      counter++;
    }

    // Save updated currentNumber
    config.currentNumber = counter;
    const setting = await AppSetting.findOne({ where: { key: 'reg_number_config' } });
    if (setting) {
      await setting.update({ value: JSON.stringify(config) });
    }

    res.json({
      message: `Successfully renumbered ${students.length} students with prefix ${config.prefix}`,
      count: students.length,
      nextNumber: counter
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
module.exports.getRegConfig = getRegConfig;
module.exports.formatRegId = formatRegId;

