const Outpass = require('../models/Outpass');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────
// @route   POST /api/admin/scan-qr
// @desc    Scan a student QR code at entry/exit gate
// @access  Private (Admin)
// ─────────────────────────────────────────────────────
const scanQR = async (req, res) => {
  const { qrData } = req.body;

  try {
    // 1. Validate input
    if (!qrData) {
      return res.status(400).json({ message: 'qrData is required.' });
    }

    // 2. Parse QR payload (it is a JSON string)
    let parsed;
    try {
      parsed = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
    } catch (e) {
      return res.status(400).json({ message: 'Invalid QR data. Could not parse JSON.' });
    }

    const { outpassId, studentId } = parsed;

    if (!outpassId || !studentId) {
      return res.status(400).json({ message: 'QR data must contain outpassId and studentId.' });
    }

    // 3. Find the outpass record
    const outpass = await Outpass.findById(outpassId).populate(
      'student',
      'name rollNo branch section roomNo parentPhone1 parentPhone2'
    );

    if (!outpass) {
      return res.status(404).json({ message: 'Outpass not found. QR may be invalid.' });
    }

    // 4. Verify studentId matches the outpass
    if (outpass.student._id.toString() !== studentId) {
      return res.status(403).json({ message: 'QR data mismatch. Invalid QR code.' });
    }

    // 5. State machine: Approved → Out → Returned → Expired
    const currentStatus = outpass.status;

    if (currentStatus === 'Approved') {
      // First scan → student is exiting
      outpass.status    = 'Out';
      outpass.scanCount = 1;
      await outpass.save();

      return res.status(200).json({
        message: '✅ Exit recorded. Student has left the campus.',
        action:  'EXIT',
        student: {
          name:    outpass.student.name,
          rollNo:  outpass.student.rollNo,
          branch:  outpass.student.branch,
          section: outpass.student.section,
          roomNo:  outpass.student.roomNo,
        },
        outpass: {
          id:      outpass._id,
          outTime: outpass.outTime,
          inTime:  outpass.inTime,
          purpose: outpass.purpose,
          type:    outpass.type,
          status:  outpass.status,
        },
      });
    }

    if (currentStatus === 'Out') {
      // Second scan → student is returning
      outpass.status    = 'Returned';
      outpass.scanCount = 2;
      await outpass.save();

      return res.status(200).json({
        message: '✅ Entry recorded. Student has returned to campus.',
        action:  'ENTRY',
        student: {
          name:    outpass.student.name,
          rollNo:  outpass.student.rollNo,
          branch:  outpass.student.branch,
          section: outpass.student.section,
          roomNo:  outpass.student.roomNo,
        },
        outpass: {
          id:      outpass._id,
          outTime: outpass.outTime,
          inTime:  outpass.inTime,
          purpose: outpass.purpose,
          type:    outpass.type,
          status:  outpass.status,
        },
      });
    }

    if (currentStatus === 'Returned') {
      // Third scan → QR is expired, already used both ways
      return res.status(410).json({
        message: '❌ QR expired. This outpass has already been fully used.',
        action:  'EXPIRED',
        student: {
          name:   outpass.student.name,
          rollNo: outpass.student.rollNo,
        },
        outpass: {
          id:     outpass._id,
          status: outpass.status,
        },
      });
    }

    // Handle any other unexpected status (Pending, Rejected)
    return res.status(403).json({
      message: `Cannot scan. Outpass status is "${currentStatus}".`,
      action:  'BLOCKED',
    });

  } catch (error) {
    console.error('Scan QR Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────
// @route   GET /api/admin/all-outpasses
// @desc    Get all outpass records (for admin dashboard)
// @access  Private (Admin)
// ─────────────────────────────────────────────────────
const getAllOutpasses = async (req, res) => {
  try {
    const { status, type } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (type)   filter.type   = type;

    const records = await Outpass.find(filter)
      .populate('student', 'name rollNo branch section roomNo parentPhone1')
      .sort({ createdAt: -1 })
      .select('-otp -qrCode');  // exclude sensitive OTP and large QR base64

    return res.status(200).json({
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Get All Outpasses Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────
// @route   POST /api/admin/login
// @desc    Admin login
// @access  Public
// ─────────────────────────────────────────────────────
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found.' });
    }

    // Using plain text comparison as requested
    if (admin.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: 'admin' },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '1d' }
    );

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: {
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Admin Login Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { scanQR, getAllOutpasses, loginAdmin };
