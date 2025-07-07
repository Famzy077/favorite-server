const jwt = require('jsonwebtoken');
const { PrismaClient, Prisma } = require('@prisma/client');
const redisClient = require('../utils/redisClient');
const bcrypt = require('bcryptjs');
const ejs = require('ejs')
const path = require('path')
const transporter = require('../config/mailer')

// Initialize Prisma Client
const prisma = new PrismaClient();

const sendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    await redisClient.setEx(`verify:${email}`, 600, code);
    const html = await ejs.renderFile(path.join(__dirname, '../views/verification.ejs'), { code });
    await transporter.sendMail({
      from: `"Favvorite plug" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      html,
    });
    res.status(200).json({ success: true, message: 'Verification code sent successfully' });
  } catch (err) {
    // FIX: Detailed logging
    console.error("--- Send Verification Code Error ---", { message: err.message, stack: err.stack, body: req.body });
    res.status(500).json({ success: false, message: 'Failed to send verification code' });
  }
};

// --- Verify Code ---
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }
    const storedCode = await redisClient.get(`verify:${email}`);
    if (!storedCode) {
      return res.status(410).json({ success: false, message: 'Code expired or not found' });
    }
    if (storedCode !== code) {
      return res.status(401).json({ success: false, message: 'Invalid verification code' });
    }
    await redisClient.setEx(`verified:${email}`, 600, 'true');
    await redisClient.del(`verify:${email}`);
    res.status(200).json({ success: true, verified: true, message: 'Verification successful' });
  } catch (err) {
    // FIX: Detailed logging
    console.error("--- Verify Code Error ---", { message: err.message, stack: err.stack, body: req.body });
    res.status(500).json({ success: false, message: 'Verification failed' });
  }
};

// CREATE - Create a new user account
const createAccount = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validate input
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'All fields are required' 
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Check Redis for email verification
    const isVerified = await redisClient.get(`verified:${normalizedEmail}`);
    if (!isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email not verified' 
      });
    }

    // Clear the verification flag to prevent reuse
    await redisClient.del(`verified:${normalizedEmail}`);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user in the database
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        verified: true
      },
      select: {
        id: true,
        email: true,
        verified: true,
        createdAt: true
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );


    // Send welcome email
    try {
      const templatePath = path.join(__dirname, '../views/welcome.ejs');
      const html = await ejs.renderFile(templatePath, { email: normalizedEmail });

      await transporter.sendMail({
        from: `"Favvorite plug" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Welcome to Favvorite plug!',
        html, // rendered EJS HTML
      });

    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Account created and logged in successfully',
      token: token, 
      user: user
    });

    console.log('Account created:', user);

  } catch (error) {
    console.error('Account creation error:', error)

    // Handle Prisma unique constraint error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }
    }
    console.error("--- Create Account Error ---", { message: error.message, stack: error.stack, body: req.body });
    res.status(500).json({ success: false, message: 'Internal server error' });   

  }
};







// LOGIN - User login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.toLowerCase();

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user doesn't exist or password is incorrect
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if email is verified
    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '60d'}
    );
    
    // Success response
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        verified: user.verified,
      },
    });
  } catch (error) {
    
    console.error("--- Login Error ---", { message: error.message, stack: error.stack, body: req.body });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// READ - Get all users (with pagination)
const getAllUsers = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get users with pagination
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        verified: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Get total count for pagination info
    const totalUsers = await prisma.user.count();
    const totalPages = Math.ceil(totalUsers / limit);

    res.status(200).json({
      success: true,
      count: users.length,
      page,
      totalPages,
      totalUsers,
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// READ - Get user by ID
const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        verified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// UPDATE - Update user account
const updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, newPassword } = req.body;

    // Find existing user
    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password if changing password
    if (newPassword) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password'
        });
      }

      const isValid = await bcrypt.compare(password, existingUser.password);
      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (email) updateData.email = email;
    if (newPassword) updateData.password = await bcrypt.hash(newPassword, 12);

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        verified: true,
        updatedAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'Account updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update account error:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// DELETE - Delete user account
const deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Delete user
    await prisma.user.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const checkEmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    return res.status(200).json({ success: true, exists: !!user });
  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Important: Always send a success message, even if the user doesn't exist.
    // This prevents "user enumeration," a security vulnerability.
    if (user) {
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

      // You can create a new EJS template for this email
      await transporter.sendMail({
        from: `"Favvorite plug" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Your Password Reset Request',
        html: `
          <h1>You requested a password reset</h1>
          <p>Click this link to reset your password: <a href="${resetUrl}">Reset Password</a> It is valid for 1 hour.</p>
        `,
      });
    }

    res.status(200).json({ success: true, message: 'If a user with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error("--- Forgot Password Error ---", { message: error.message, stack: error.stack, body: req.body });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword },
    });
    res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error("--- Reset Password Error ---", { message: error.message, stack: error.stack });
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  sendVerificationCode,
  verifyCode,
  createAccount,
  login,
  checkEmail,
  getAllUsers,
  getUser,
  updateAccount,
  deleteAccount,
  forgotPassword,
  resetPassword,
};
