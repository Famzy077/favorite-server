const jwt = require('jsonwebtoken');
const { PrismaClient, Prisma } = require('@prisma/client');
const redisClient = require('../utils/redisClient');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');

// Initialize Prisma Client
const prisma = new PrismaClient();

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
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    // Store code in Redis with 5 min expiry
    await redisClient.setEx(`verify:${email}`, 600, code);
    // await redisClient.set(`verify:${email}`, 'true', { EX: 600 });


    // Send code via email
    const mailResponse = await transporter.sendMail({
      from: `"Favorite Plug" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Verification Code',
      text: `Your verification code is: ${code}`,
    });

    console.log(`Verification code sent to ${email}: ${code}`);
    console.log('Mail response:', mailResponse.response || mailResponse);

    const responsePayload = {
      success: true,
      message: 'Verification code sent successfully'
    };

    if (process.env.NODE_ENV === 'development') {
      responsePayload.debug = { code };
    }

    res.status(200).json(responsePayload);

  } catch (err) {
    console.error('Error sending verification code:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code',
      error: err.message,
    });
  }
};

// Verify submitted code
const verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and code are required' });
    }

    const storedCode = await redisClient.get(`verify:${email}`);

    if (!storedCode) {
      return res.status(410).json({ success: false, verified: false, message: 'Code expired or not found' });
    }

    if (storedCode !== code) {
      return res.status(401).json({ success: false, verified: false, message: 'Invalid verification code' });
    }

    // Code is valid - set verification flag with 10 min expiry
    await redisClient.setEx(`verified:${email}`, 600, 'true');
    await redisClient.del(`verify:${email}`); // Clean up the code

    res.status(200).json({ 
      success: true, 
      verified: true, 
      message: 'Verification successful',
      email // Include email in response
    });
  } catch (err) {
    console.error('Error verifying code:', err);
    res.status(500).json({
      success: false,
      verified: false,
      message: 'Verification failed due to server error',
      error: err.message,
    });
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

    // Send welcome email (optional)
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Favorite Plug" <${process.env.EMAIL_USER}>`,
        to: normalizedEmail,
        subject: 'Welcome to Favorite Plug!',
        html: `<h1>Welcome ${normalizedEmail}!</h1><p>Your account has been successfully created.</p>`
      });
    } catch (emailError) {
      console.error('Welcome email failed:', emailError);
      // You may optionally log this somewhere
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user
    });

    console.log('Account created:', user);

  } catch (error) {
    console.error('Account creation error:', error);

    // Handle Prisma unique constraint error
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          success: false,
          message: 'User already exists'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
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
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed due to server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
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
};
