const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Zod Schemas ─────────────────────────────────────────────────────────────

const registerSchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .trim()
    .min(1, 'Name is required')
    .max(50, 'Name must be 50 characters or fewer'),

  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(25, 'Password must be 25 characters or fewer')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[^a-zA-Z0-9\s]/, 'Password must contain at least one symbol (!@#$%^&* etc.)'),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid email address'),

  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
});

// ── Routes ──────────────────────────────────────────────────────────────────

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.errors[0].message;
    return res.status(400).json({ message: firstError });
  }

  const { name, email, password } = result.data;

  try {
    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    const firstError = result.error.errors[0].message;
    return res.status(400).json({ message: firstError });
  }

  const { email, password } = result.data;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
