const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const router = express.Router();

const GOOGLE_CLIENT_ID = '511117420048-fjnoij5t6odb9fgrlhla5p2bv6sn2taq.apps.googleusercontent.com';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Google Auth
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name, picture, provider: 'google' });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { email: user.email, name: user.name, picture: user.picture } });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google token' });
  }
});

// Signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });
    const hashed = await bcrypt.hash(password, 10);
    user = await User.create({ email, password: hashed, provider: 'local' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const user = await User.findOne({ email, provider: 'local' });
    if (!user) return res.status(400).json({ error: 'User not found' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid password' });
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router; 