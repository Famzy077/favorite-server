const express = require('express');
const { sendVerificationCode, verifyCode } = require("../controllers/authController");

const router = express.Router();

router.post('/send-code', sendVerificationCode);
router.post('/verify-code', verifyCode);

module.exports = router;
