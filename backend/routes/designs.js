const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const Design = require('../models/Design');

// ── Middleware: verify JWT ──────────────────────────────────────────────────
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer '))
    return res.status(401).json({ message: 'Not authorized' });

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// ── Zod Schemas ─────────────────────────────────────────────────────────────

const designSaveSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Design name is required')
    .max(60, 'Design name must be 60 characters or fewer')
    .default('Untitled Design'),

  thumbnail: z.string().nullable().optional(),
  floorplan: z.any().optional().default({}),
  items: z.array(z.any()).optional().default([]),
});

// ── Routes ──────────────────────────────────────────────────────────────────

// GET /api/designs — list all designs for logged-in user
router.get('/', protect, async (req, res) => {
  try {
    const designs = await Design.find({ user: req.userId })
      .select('name thumbnail createdAt updatedAt')
      .sort({ updatedAt: -1 });
    res.json(designs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/designs/:id — get a single design (full data)
router.get('/:id', protect, async (req, res) => {
  try {
    const design = await Design.findOne({ _id: req.params.id, user: req.userId });
    if (!design) return res.status(404).json({ message: 'Design not found' });
    res.json(design);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/designs — save a new design
// Body: { name, thumbnail, floorplan, items }
router.post('/', protect, async (req, res) => {
  const result = designSaveSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.errors[0].message;
    return res.status(400).json({ message: firstError });
  }

  const { name, thumbnail, floorplan, items } = result.data;

  try {
    const design = await Design.create({
      user: req.userId,
      name,
      thumbnail: thumbnail || null,
      floorplan: floorplan || {},
      items: items || [],
    });
    res.status(201).json(design);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/designs/:id — update an existing design
router.put('/:id', protect, async (req, res) => {
  const result = designSaveSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.errors[0].message;
    return res.status(400).json({ message: firstError });
  }

  const { name, thumbnail, floorplan, items } = result.data;

  try {
    const design = await Design.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { name, thumbnail, floorplan, items },
      { new: true, runValidators: true }
    );
    if (!design) return res.status(404).json({ message: 'Design not found' });
    res.json(design);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/designs/:id — delete a design
router.delete('/:id', protect, async (req, res) => {
  try {
    const design = await Design.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!design) return res.status(404).json({ message: 'Design not found' });
    res.json({ message: 'Design deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
