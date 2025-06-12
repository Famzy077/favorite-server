const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET all items from the logged-in user's wishlist
exports.getWishlist = async (req, res) => {
    const userId = req.user.id;
    try {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId },
            include: { product: true }, // Include the full product details
            orderBy: { createdAt: 'desc' }
        });
        // We only want to return the product data
        const products = wishlistItems.map(item => item.product);
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// ADD an item to the wishlist
exports.addToWishlist = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.body;

    try {
        const wishlistItem = await prisma.wishlistItem.create({
            data: { userId, productId: parseInt(productId, 10) }
        });
        res.status(201).json({ success: true, message: 'Product added to wishlist.', data: wishlistItem });
    } catch (error) {
        if (error.code === 'P2002') { // Handles duplicate items
            return res.status(409).json({ success: false, message: 'Product already in wishlist.' });
        }
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// REMOVE an item from the wishlist
exports.removeFromWishlist = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    try {
        await prisma.wishlistItem.delete({
            where: {
                userId_productId: { // This is the unique key we defined in the schema
                    userId,
                    productId: parseInt(productId, 10)
                }
            }
        });
        res.status(200).json({ success: true, message: 'Product removed from wishlist.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Could not remove product from wishlist.' });
    }
};