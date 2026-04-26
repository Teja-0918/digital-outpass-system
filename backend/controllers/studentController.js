const QRCode = require('qrcode');
const Student = require('../models/Student');
const Outpass = require('../models/Outpass');

// ─────────────────────────────────────────────────────
// @route   POST /api/student/request-outpass
// @desc    Submit outpass request and send OTP to parent
// @access  Private (Student)
// ─────────────────────────────────────────────────────
const requestOutpass = async (req, res) => {
  const { studentId, outTime, inTime, purpose, type } = req.body;

  try {
    // 1. Validate required fields
    if (!studentId || !outTime || !inTime || !purpose) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // 2. Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    // 3. Ensure student is registered
    if (!student.isRegistered) {
      return res.status(403).json({ message: 'Student not fully registered.' });
    }

    // 4. Generate OTP (fixed as 1234 for now — replace with real SMS service later)
    const otp = '1234';

    // 5. Create outpass record in DB
    const outpass = await Outpass.create({
      student:  student._id,
      rollNo:   student.rollNo,
      type:     type || 'outpass',
      outTime,
      inTime,
      purpose,
      otp,
      status:   'Pending',
    });

    // 6. Log parent phones (OTP would be sent via SMS in production)
    console.log(
      `OTP ${otp} to be sent → Parent1: ${student.parentPhone1}, Parent2: ${student.parentPhone2}`
    );

    return res.status(201).json({
      message:   'Outpass request created. OTP sent to parent.',
      outpassId: outpass._id,
      parentPhone1: student.parentPhone1 || 'Not set',
      parentPhone2: student.parentPhone2 || 'Not set',
    });
  } catch (error) {
    console.error('Request Outpass Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────
// @route   POST /api/student/verify-otp
// @desc    Verify OTP and generate QR code on success
// @access  Private (Student)
// ─────────────────────────────────────────────────────
const verifyOtp = async (req, res) => {
  const { outpassId, otp } = req.body;

  try {
    // 1. Validate fields
    if (!outpassId || !otp) {
      return res.status(400).json({ message: 'outpassId and otp are required.' });
    }

    // 2. Find outpass
    const outpass = await Outpass.findById(outpassId).populate('student', 'name rollNo branch section roomNo');
    if (!outpass) {
      return res.status(404).json({ message: 'Outpass request not found.' });
    }

    // 3. Check if already verified
    if (outpass.otpVerified) {
      return res.status(409).json({ message: 'OTP already verified for this request.' });
    }

    // 4. Check if OTP matches
    if (outpass.otp !== otp.toString().trim()) {
      return res.status(401).json({ message: 'Invalid OTP. Please try again.' });
    }

    // 5. Build QR payload
    const qrPayload = {
      outpassId:  outpass._id.toString(),
      studentId:  outpass.student._id.toString(),
      rollNo:     outpass.rollNo,
      name:       outpass.student.name,
      outTime:    outpass.outTime,
      inTime:     outpass.inTime,
      purpose:    outpass.purpose,
      type:       outpass.type,
      issuedAt:   new Date().toISOString(),
    };

    // 6. Generate QR code as a base64 data URL
    const qrDataURL = await QRCode.toDataURL(JSON.stringify(qrPayload), {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
      color: {
        dark: '#000000',   // Black for maximum scanner contrast
        light: '#ffffff',
      },
    });

    // 7. Update outpass in DB
    outpass.otpVerified = true;
    outpass.status      = 'Approved';
    outpass.qrCode      = qrDataURL;
    outpass.qrData      = qrPayload;
    await outpass.save();

    return res.status(200).json({
      message:  'OTP verified. Outpass approved.',
      outpass: {
        id:        outpass._id,
        rollNo:    outpass.rollNo,
        outTime:   outpass.outTime,
        inTime:    outpass.inTime,
        purpose:   outpass.purpose,
        type:      outpass.type,
        status:    outpass.status,
        issuedAt:  qrPayload.issuedAt,
      },
      qrCode: qrDataURL,   // base64 image — display in <img src="..."> on frontend
    });
  } catch (error) {
    console.error('Verify OTP Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// ─────────────────────────────────────────────────────
// @route   GET /api/student/history/:studentId
// @desc    Get all outpass requests for a student
// @access  Private (Student)
// ─────────────────────────────────────────────────────
const getHistory = async (req, res) => {
  try {
    const { studentId } = req.params;

    const records = await Outpass.find({ student: studentId })
      .sort({ createdAt: -1 })
      .select('-otp');  // never expose OTP in history

    return res.status(200).json({
      count: records.length,
      records,
    });
  } catch (error) {
    console.error('Get History Error:', error.message);
    return res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

module.exports = { requestOutpass, verifyOtp, getHistory };
