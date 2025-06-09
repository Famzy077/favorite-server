const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create or update user details.
 * If details exist, update them; otherwise, create new.
 */
const upsertUserDetails = async (req, res) => {
  const { fullName, address, phone } = req.body;
  const userId = req.user.id;
  console.log('User ID from verifyToken:', req.user.id);


  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication invalid: No user ID found',
    });
  }

  try {
    // Check if user exists and is verified
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

    // Upsert userDetails: update if exists, else create
    const userDetails = await prisma.userDetails.upsert({
      where: { userId },
      update: { fullName, address, phone },
      create: { userId, fullName, address, phone },
    });

    return res.status(200).json({
      success: true,
      message: 'User details saved or updated successfully',
      data: userDetails,
    });
  } catch (error) {
    console.error('User details upsert error:', error);

    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Duplicate entry: user details already exist.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get user details by userId from params.
 */
const getUserDetails = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ error: 'User ID not found in request.' });
  }

  try {
    const userDetails = await prisma.userDetails.findUnique({
      where: { userId },
    });

    if (!userDetails) {
      return res.status(404).json({ message: 'User details not found.' });
    }

    return res.status(200).json({ success: true, data: userDetails });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all users with their details.
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        verified: true,
        createdAt: true,
        userDetails: {
          select: {
            fullName: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'All users fetched successfully',
      data: users,
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete user details for the authenticated user.
 */
const deleteUserDetails = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(400).json({ message: 'Missing userId from token' });
  }

  try {
    await prisma.userDetails.delete({ where: { userId } });

    return res.status(200).json({ success: true, message: 'User details deleted.' });
  } catch (error) {
    console.error('Error deleting user details:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error or details not found.',
    });
  }
};

module.exports = {
  upsertUserDetails,
  getUserDetails,
  getAllUsers,
  deleteUserDetails,
};
