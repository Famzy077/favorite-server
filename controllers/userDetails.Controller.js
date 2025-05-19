const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE User Details
const createUserDetails = async (req, res) => {
  const { fullName, address, phone } = req.body;
  
  try {
    // Safely extract user ID
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false,
        message: 'Authentication invalid: No user ID found' 
      });
    }

    // Verify user exists and is verified
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      select: { verified: true }
    });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User account not found' 
      });
    }

    if (!user.verified) {
      return res.status(403).json({ 
        success: false,
        message: 'Please verify your email before adding details' 
      });
    }

    // Check for existing details
    const existingDetails = await prisma.userDetails.findUnique({ 
      where: { userId } 
    });

    if (existingDetails) {
      return res.status(409).json({ 
        success: false,
        message: 'User details already exist',
        data: existingDetails
      });
    }

    // Create new details
    const userDetails = await prisma.userDetails.create({
      data: { 
        userId, 
        fullName, 
        address, 
        phone 
      },
    });

    return res.status(201).json({ 
      success: true,
      message: 'User details saved successfully', 
      data: userDetails 
    });

  } catch (error) {
    console.error('User details creation error:', error);
    
    // Handle Prisma errors
    if (error.code === 'P2002') {  // Unique constraint violation
      return res.status(400).json({
        success: false,
        message: 'User details already exist for this account'
      });
    }

    return res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect(); // Proper cleanup
  }
};

// READ (Get current user's details)
const getUserDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    const userDetails = await prisma.userDetails.findUnique({
      where: { userId },
    });

    if (!userDetails) {
      return res.status(404).json({ message: 'User details not found.' });
    }

    return res.status(200).json({ data: userDetails });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// UPDATE
const updateUserDetails = async (req, res) => {
  const userId = req.user.id;
  const { fullName, address, phone } = req.body;

  try {
    const updatedDetails = await prisma.userDetails.update({
      where: { userId },
      data: { fullName, address, phone },
    });

    return res.status(200).json({ message: 'User details updated.', data: updatedDetails });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error or details not found.' });
  }
};

// DELETE
const deleteUserDetails = async (req, res) => {
  const userId = req.user.id;

  try {
    await prisma.userDetails.delete({ where: { userId } });

    return res.status(200).json({ message: 'User details deleted.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error or details not found.' });
  }
};

module.exports = {
  createUserDetails,
  getUserDetails,
  updateUserDetails,
  deleteUserDetails,
};
