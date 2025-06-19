const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// --- GET all items from the logged-in user's wishlist (Corrected) ---
const getWishlist = async (req, res) => {
    const userId = req.user.id;
    try {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        images: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' }
        });
        

        const products = wishlistItems.map(item => item.product);

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error("--- Get Wishlist Error ---", { message: error.message, stack: error.stack });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// --- ADD an item to the wishlist ---
const addToWishlist = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.body;

    try {
        const wishlistItem = await prisma.wishlistItem.create({
            data: { userId, productId: parseInt(productId, 10) }
        });
        res.status(201).json({ success: true, message: 'Product added to wishlist.', data: wishlistItem });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(409).json({ success: false, message: 'Product already in wishlist.' });
        }
        console.error("--- Add to Wishlist Error ---", { message: error.message });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

// --- REMOVE an item from the wishlist ---
const removeFromWishlist = async (req, res) => {
    const userId = req.user.id;
    const { productId } = req.params;

    try {
        await prisma.wishlistItem.delete({
            where: {
                userId_productId: {
                    userId,
                    productId: parseInt(productId, 10)
                }
            }
        });
        res.status(200).json({ success: true, message: 'Product removed from wishlist.' });
    } catch (error) {
        console.error("--- Remove From Wishlist Error ---", { message: error.message });
        res.status(500).json({ success: false, message: 'Could not remove product from wishlist.' });
    }
};

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
};