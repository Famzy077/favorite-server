const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const transporter = require('../config/mailer');
const ejs = require('ejs');
const path = require('path');

// --- CREATE a new Order from the user's cart ---
const createOrder = async (req, res) => {
  const userId = req.user.id;
  try {
    const { shippingAddress, contactPhone, fullName } = req.body;

    if (!shippingAddress || !contactPhone || !fullName) {
      return res.status(400).json({ success: false, message: "Full name, shipping address, and phone number are required." });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: { include: { images: true } } } } }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Your cart is empty." });
    }

    const totalAmount = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddress,
          contactPhone,
          customerName: fullName, // Save the customer's name with the order
          status: "PENDING"
        }
      });

      await tx.orderItem.createMany({
        data: cart.items.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return newOrder;
    });

    try {
      const adminEmail = process.env.EMAIL_USER;
      const customer = await prisma.user.findUnique({ where: { id: userId } });
      
      const emailHtml = await ejs.renderFile(
          path.join(__dirname, '../views/new-order-notification.ejs'),
          { order, customer, cartItems: cart.items, totalAmount }
      );

      await transporter.sendMail({
          from: `"Favorite Plug" <${adminEmail}>`,
          to: adminEmail,
          subject: `New Order Received! #${order.id.slice(-6)}`,
          html: emailHtml,
      });
    } catch (emailError) {
      console.error("--- Failed to send new order email notification ---", emailError);
    }

    res.status(201).json({ success: true, message: "Order placed successfully!", order });
  } catch (error) {
    console.error("--- Create Order Error ---", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// --- GET all orders (for Admin) ---
const getAllOrders = async (req, res) => {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: { select: { email: true, userDetails: { select: { fullName: true } } } } }
        });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("--- Get All Orders Error ---", { message: error.message });
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// --- GET a single order by ID (for Admin) ---
const getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: { include: { images: true } } } },
                user: { select: { email: true, userDetails: { select: { fullName: true } } } }
            }
        });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }
        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("--- Get Order By ID Error ---", { message: error.message });
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

// --- UPDATE an order's status (for Admin) ---
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // e.g., "SHIPPED", "DELIVERED", "CANCELLED"

        if (!status) {
            return res.status(400).json({ success: false, message: "Status is required." });
        }

        const updatedOrder = await prisma.order.update({
            where: { id },
            data: { status }
        });

        res.status(200).json({ success: true, message: `Order status updated to ${status}.`, data: updatedOrder });
    } catch (error) {
        console.error("--- Update Order Status Error ---", { message: error.message });
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};


module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderStatus,
};