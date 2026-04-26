const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    // ✅ Seeding AFTER connection
    const Student = require("../models/Student");
    const Admin = require("../models/Admin");

    const studentCount = await Student.countDocuments();
    console.log(`Students found in DB: ${studentCount}`);
    if (studentCount === 0) {
      await Student.create({
        rollNo: "22VV1A0501",
        name: "Aarav Singh",
        parentPhone1: "9876543210",
        parentPhone2: "9123456780"
      });
      console.log("Seeded default student (Aarav Singh)");
    }

    const adminCount = await Admin.countDocuments();
    console.log(`Admins found in DB: ${adminCount}`);
    if (adminCount === 0) {
      await Admin.create({
        username: "admin",
        password: "admin123"
      });
      console.log("Seeded default admin (admin/admin123)");
    }

  } catch (error) {
    console.error("DB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;