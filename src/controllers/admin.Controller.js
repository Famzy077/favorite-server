const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
            name: true,
            phone: true,
            address: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      }
    });

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error retrieving users' });
  }
};

module.exports = {
  getAllUsers,
};
