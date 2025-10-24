const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all users for the admin dashboard
const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        email: true,
        role: true,
        isBlocked: true,
        verified: true,
        createdAt: true,
        userDetails: {
          select: {
            fullName: true,
          }
        }
      },
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- BLOCK or UNBLOCK a user ---
const toggleUserBlockStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;

    // Safety check: An admin cannot block themselves
    if (id === adminUserId) {
      return res.status(400).json({ success: false, message: "Admin cannot block themselves." });
    }

    // Find the user to get their current block status
    const userToToggle = await prisma.user.findUnique({ where: { id } });

    if (!userToToggle) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Flip the boolean value
    const newBlockStatus = !userToToggle.isBlocked;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isBlocked: newBlockStatus },
      select: { id: true, email: true, isBlocked: true } // Return minimal data
    });

    const message = newBlockStatus ? "User successfully blocked." : "User successfully unblocked.";
    res.status(200).json({ success: true, message, data: updatedUser });

  } catch (error) {
    console.error("Toggle user block status error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// --- GET stats for the dashboard overview ---
const getDashboardStats = async (req, res) => {
    try {
      const totalUsers = await prisma.user.count();
      const totalProducts = await prisma.product.count();

      // Calculate the date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const userGrowthLast30Days = await prisma.user.count({
        where: {
          createdAt: {
            gte: thirtyDaysAgo, // gte = greater than or equal to
          }
        }
      });

      const stats = {
        totalUsers,
        totalProducts,
        userGrowthLast30Days
      };

      res.status(200).json({ success: true, data: stats });

    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
};


module.exports = {
  getAllUsers,
  toggleUserBlockStatus,
  getDashboardStats,
};