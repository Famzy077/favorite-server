const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

// CREATE or UPDATE User Details
const createOrUpdateUserDetails = async (req, res) => {
  const { fullName, address, phone } = req.body;

  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication invalid: No user ID found',
      });
    }

    // Verify user exists and is verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { verified: true },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found',
      });
    }

    if (!user.verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before adding details',
      });
    }

    // Check for existing details
    const existingDetails = await prisma.userDetails.findUnique({
      where: { userId },
    });

    if (existingDetails) {
      // Update existing user details
      const updatedDetails = await prisma.userDetails.update({
        where: { userId },
        data: { fullName, address, phone },
      });

      return res.status(200).json({
        success: true,
        message: 'User details updated successfully',
        data: updatedDetails,
      });
    }

    // Create new details
    const userDetails = await prisma.userDetails.create({
      data: {
        userId,
        fullName,
        address,
        phone,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'User details saved successfully',
      data: userDetails,
    });

  } catch (error) {
    console.error('User details creation error:', error);

    // Handle Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: 'User details already exist for this account',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    await prisma.$disconnect();
  }
};

// READ (Get current user's details)
const getUserDetails = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID not found in request.' });
  }

  try {
    const userDetails = await prisma.userDetails.findUnique({
      where: { userId }, // assuming userId is @unique
    });

    if (!userDetails) {
      return res.status(404).json({ message: 'User details not found.' });
    }

    res.status(200).json({ userDetails });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// UPDATE
const updateUserDetails = async (req, res) => {
  const userId = req.user?.id;
  const { fullName, address, phone } = req.body;

  try {
    const updatedDetails = await prisma.userDetails.upsert({
      where: { userId },
      update: { fullName, address, phone },
      create: {
        userId,
        fullName,
        address: address || '', // optional fallback
        phone,
      },
    });

    return res.status(200).json({
      message: 'User details saved or updated.',
      data: updatedDetails,
    });
  } catch (error) {
    console.error('Error updating details:', error);
    return res.status(500).json({ message: 'Server error.' });
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
  createOrUpdateUserDetails, // 🚀 updated name
  getUserDetails,
  updateUserDetails,
  deleteUserDetails,
};
