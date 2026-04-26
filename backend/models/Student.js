const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    branch: {
      type: String,
      trim: true,
    },
    section: {
      type: String,
      trim: true,
    },
    roomNo: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    parentPhone1: {
      type: String,
      trim: true,
    },
    parentPhone2: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      default: null, // null means student exists but hasn't registered yet
    },
    isRegistered: {
      type: Boolean,
      default: false,
    },
    resetOtp: {
      type: String,
      default: null,
    },
    resetOtpExpiry: {
      type: Date,
      default: null,
    },
    resetVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
