const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Student = require('../models/Student');

// ─────────────────────────────────────────
// @route   POST /api/auth/signup
// @desc    Register a pre-stored student
// @access  Public
// ─────────────────────────────────────────
const signup = async (req, res) => {
  const { rollNo, name, branch, section, roomNo, phone, password } = req.body;

  try {
    // 1. Validate required fields
    if (!rollNo || !name || !branch || !section || !roomNo || !phone || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // 2. Check if rollNo exists in DB (pre-stored by admin)
    const student = await Student.findOne({ rollNo: rollNo.toUpperCase() });
    if (!student) {
      return res.status(404).json({
        message: 'Student not found. Please contact admin to register your roll number.',
      });
    }

    // 3. Check if student is already registered
    if (student.isRegistered) {
      return res.status(409).json({
        message: 'Student is already registered. Please login.',
      });
    }

    // 4. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Update student record with signup details
    student.name    = name.trim();
    student.branch  = branch.trim();
    student.section = section.trim();
    student.roomNo  = roomNo.trim();
    student.phone   = phone.trim();
    student.password     = hashedPassword;
    student.isRegistered = true;
    await student.save();

    return res.status(201).json({ message: 'Registration successful. You can now login.' });
  } catch (error) {
    console.error('Signup Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login a registered student
// @access  Public
// ─────────────────────────────────────────
const login = async (req, res) => {
  const { rollNo, password } = req.body;

  try {
    // 1. Validate required fields
    if (!rollNo || !password) {
      return res.status(400).json({ message: 'Roll number and password are required.' });
    }

    // 2. Find student by roll number
    const student = await Student.findOne({ rollNo: rollNo.toUpperCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // 3. Check if student has completed signup
    if (!student.isRegistered || !student.password) {
      return res.status(401).json({
        message: 'Account not set up. Please complete signup first.',
      });
    }

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    // 5. Generate JWT token
    const token = jwt.sign(
      { id: student._id, rollNo: student.rollNo },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 6. Return token + student info
    return res.status(200).json({
      message: 'Login successful.',
      token,
      student: {
        id:           student._id,
        rollNo:       student.rollNo,
        name:         student.name,
        branch:       student.branch,
        section:      student.section,
        roomNo:       student.roomNo,
        parentPhone1: student.parentPhone1,
        parentPhone2: student.parentPhone2,
      },
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { signup, login, forgotPassword, verifyResetOtp, resetPassword };

// ─────────────────────────────────────────
// @route   POST /api/auth/forgot-password
// @desc    Generate OTP for password reset
// @access  Public
// ─────────────────────────────────────────
async function forgotPassword(req, res) {
  const { rollNo } = req.body;

  try {
    // 1. Validate
    if (!rollNo) {
      return res.status(400).json({ message: 'Roll number is required.' });
    }

    // 2. Find student
    const student = await Student.findOne({ rollNo: rollNo.toUpperCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student not found. Please check your roll number.' });
    }

    // 3. Must be registered
    if (!student.isRegistered) {
      return res.status(400).json({ message: 'Account not registered yet. Please sign up first.' });
    }

    // 4. Default OTP (fixed for now)
    const otp = '1234';

    // 5. Store OTP with 5-minute expiry
    student.resetOtp = otp;
    student.resetOtpExpiry = new Date(Date.now() + 5 * 60 * 1000);
    student.resetVerified = false;
    await student.save();

    // 6. Simulate OTP send (console log for now)
    console.log(`\n═════════════════════════════════════════`);
    console.log(`  📱 OTP for ${student.rollNo}: ${otp}`);
    console.log(`  📞 Sent to: ${student.phone || 'student mobile'}`);
    console.log(`  ⏰ Expires in 5 minutes`);
    console.log(`═════════════════════════════════════════\n`);

    // 7. Mask phone for frontend display
    const maskedPhone = student.phone
      ? student.phone.replace(/^(\d{2})\d+(\d{2})$/, '$1******$2')
      : 'your registered mobile';

    return res.status(200).json({
      message: 'OTP sent successfully.',
      maskedPhone,
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
}

// ─────────────────────────────────────────
// @route   POST /api/auth/verify-reset-otp
// @desc    Verify the OTP for password reset
// @access  Public
// ─────────────────────────────────────────
async function verifyResetOtp(req, res) {
  const { rollNo, otp } = req.body;

  try {
    // 1. Validate
    if (!rollNo || !otp) {
      return res.status(400).json({ message: 'Roll number and OTP are required.' });
    }

    // 2. Find student
    const student = await Student.findOne({ rollNo: rollNo.toUpperCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // 3. Check OTP exists
    if (!student.resetOtp || !student.resetOtpExpiry) {
      return res.status(400).json({ message: 'No OTP request found. Please request a new OTP.' });
    }

    // 4. Check expiry
    if (new Date() > student.resetOtpExpiry) {
      student.resetOtp = null;
      student.resetOtpExpiry = null;
      student.resetVerified = false;
      await student.save();
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // 5. Compare OTP
    if (student.resetOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // 6. Mark verified
    student.resetVerified = true;
    await student.save();

    return res.status(200).json({ message: 'OTP verified successfully.' });
  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
}

// ─────────────────────────────────────────
// @route   POST /api/auth/reset-password
// @desc    Reset student password after OTP verification
// @access  Public
// ─────────────────────────────────────────
async function resetPassword(req, res) {
  const { rollNo, newPassword } = req.body;

  try {
    // 1. Validate
    if (!rollNo || !newPassword) {
      return res.status(400).json({ message: 'Roll number and new password are required.' });
    }

    // 2. Password strength
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // 3. Find student
    const student = await Student.findOne({ rollNo: rollNo.toUpperCase() });
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // 4. Must have verified OTP
    if (!student.resetVerified) {
      return res.status(403).json({ message: 'OTP not verified. Please complete verification first.' });
    }

    // 5. Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 6. Update password and clear reset fields
    student.password = hashedPassword;
    student.resetOtp = null;
    student.resetOtpExpiry = null;
    student.resetVerified = false;
    await student.save();

    console.log(`✅ Password reset successful for ${student.rollNo}`);

    return res.status(200).json({ message: 'Password reset successful. You can now login with your new password.' });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
}
