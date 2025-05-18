const express = require('express');
const { sendVerificationCode,
    verifyCode,
    createAccount,
    getAllUsers,
    getUser,
    updateAccount,
    deleteAccount } = require("../controllers/auth.Controller.js");

const router = express.Router();

router.post('/send-code', sendVerificationCode);
router.post('/verify-code', verifyCode);
router.post('/create-acount', createAccount); // CREATE,
router.get('/accounts', getAllUsers); // READ All Users
router.get('/accounts/:id', getUser); // READ 
router.put('/accounts/:id', updateAccount); // UPDATE
router.delete('/accounts/:id', deleteAccount); // DELETE

module.exports = router;