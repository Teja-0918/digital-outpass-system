const mongoose = require('mongoose');

const outpassSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    rollNo: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['outpass', 'homepass'],
      default: 'outpass',
    },
    outTime: {
      type: String,
      required: true,
    },
    inTime: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: String,
      default: null,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Used', 'Out', 'Returned'],
      default: 'Pending',
    },
    qrCode: {
      type: String,  // stores base64 data URL of the QR image
      default: null,
    },
    qrData: {
      type: mongoose.Schema.Types.Mixed,  // raw JSON encoded in QR
      default: null,
    },
    scanCount: {
      type: Number,
      default: 0,   // 0 = Not Used, 1 = Out, 2 = Returned
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Outpass', outpassSchema);
