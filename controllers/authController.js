const redisClient = require('../utils/redisClient');
const nodemailer = require('nodemailer');

// Configure mail transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Send verification code
const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Store code in Redis with 5 min expiry
    await redisClient.setEx(`verify:${email}`, 300, code);

    // Send code via email
    await transporter.sendMail({
      from: `"Favorite Plug" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}`,
    });

    console.log(`Verification code sent to ${email}: ${code}`);
    res.status(200).json({ message: 'Verification code sent successfully' });
  } catch (err) {
    console.error('Error sending verification code:', err);
    res.status(500).json({ message: 'Failed to send verification code' });
  }
};

// Verify submitted code
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    const storedCode = await redisClient.get(`verify:${email}`);

    if (!storedCode) {
      return res.status(410).json({ verified: false, message: 'Code expired or not found' });
    }

    if (storedCode !== code) {
      return res.status(401).json({ verified: false, message: 'Invalid verification code' });
    }

    // Code is valid, delete it
    await redisClient.del(`verify:${email}`);

    res.status(200).json({ verified: true, message: 'Verification successful' });
  } catch (err) {
    console.error('Error verifying code:', err);
    res.status(500).json({ verified: false, message: 'Verification failed due to server error' });
  }
};

module.exports = {
  sendVerificationCode,
  verifyCode,
};
