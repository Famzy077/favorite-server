const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// CREATE
const createUserDetails = async (req, res) => {
  const { fullName, address, phone } = req.body;
  const userId = req.user.id;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.verified) {
      return res.status(403).json({ message: 'User not verified.' });
    }

    const existingDetails = await prisma.userDetails.findUnique({ where: { userId } });
    if (existingDetails) {
      return res.status(400).json({ message: 'User details already exist.' });
    }

    const userDetails = await prisma.userDetails.create({
      data: { userId, fullName, address, phone },
    });

    return res.status(201).json({ message: 'User details saved.', data: userDetails });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
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
