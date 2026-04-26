const express = require('express');
const router = express.Router();
const { signup, login, forgotPassword, verifyResetOtp, resetPassword } = require('../controllers/authController');

// POST /api/auth/signup
router.post('/signup', signup);

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/forgot-password
router.post('/forgot-password', forgotPassword);

// POST /api/auth/verify-reset-otp
router.post('/verify-reset-otp', verifyResetOtp);

// POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;
