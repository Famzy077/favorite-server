const express = require('express');
const { sendVerificationCode,
    verifyCode,
    createAccount,
    login,
    getAllUsers,
    getUser,
    updateAccount,
    checkEmail,
    deleteAccount } = require("../controllers/auth.Controller.js");
const { sendCodeLimiter } = require('../middleware/rateLimiter');
const {verifyToken} = require('../middleware/authMiddleware.js');



const router = express.Router();
router.post('/send-code', sendCodeLimiter, sendVerificationCode); //Send Verification Code
router.post('/verify-code', verifyCode); //Verify  Code
router.post('/create-account', createAccount); // CREATE,
router.get('/check-email', checkEmail); // Check if email exists
router.post('/login', login); // LOGIN
router.get('/accounts', getAllUsers); // READ All Users
router.get('/accounts/:id', getUser); // READ 
router.put('/accounts/:id', verifyToken, updateAccount); // UPDATE
router.delete('/accounts/:id', verifyToken, deleteAccount);

module.exports = router;