const express = require('express');
const router = express.Router();
const { scanQR, getAllOutpasses, loginAdmin } = require('../controllers/adminController');

// POST /api/admin/login
router.post('/login', loginAdmin);

// POST /api/admin/scan-qr
router.post('/scan-qr', scanQR);

// GET /api/admin/all-outpasses?status=Out&type=outpass
router.get('/all-outpasses', getAllOutpasses);

module.exports = router;
