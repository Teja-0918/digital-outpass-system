const express = require('express');
const router = express.Router();
const {
  requestOutpass,
  verifyOtp,
  getHistory,
} = require('../controllers/studentController');

// POST /api/student/request-outpass
router.post('/request-outpass', requestOutpass);

// POST /api/student/verify-otp
router.post('/verify-otp', verifyOtp);

// GET /api/student/history/:studentId
router.get('/history/:studentId', getHistory);

module.exports = router;
