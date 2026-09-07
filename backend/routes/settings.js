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

module.exports = router;
