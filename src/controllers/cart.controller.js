const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper function to get or create a cart for the current user
const getOrCreateCart = async (userId) => {
  let cart = await prisma.cart.findUnique({
    where: { userId },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId },
    });
  }

  return cart;
};

// --- GET the user's cart (Corrected and Final Version) ---
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true,
              }
            },
          },
        },
      },
    });

    if (!cart) {
      return res.status(200).json({ success: true, data: { items: [], total: 0 } });
    }
    
    // Calculate total price on the backend
    const total = cart.items.reduce((sum, item) => {
        return sum + item.product.price * item.quantity;
    }, 0);

    const cartItemsWithImages = cart.items.map(item => ({
      ...item,
      product: {
        ...item.product,
        // Use the first image as the display image, with a fallback
        image: item.product.images && item.product.images.length > 0 ? item.product.images[0].url : '/default-placeholder.png'
      }
    }));

    res.status(200).json({ success: true, data: { ...cart, items: cartItemsWithImages, total } });
  } catch (error) {
    console.error("--- Get Cart Error ---", { message: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// --- ADD an item to the cart ---
const addItemToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    const cart = await getOrCreateCart(userId);

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: parseInt(productId, 10),
        },
      },
    });

    let cartItem;
    if (existingItem) {
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: parseInt(productId, 10),
          quantity: quantity,
        },
      });
    }

    res.status(201).json({ success: true, message: 'Item added to cart.', data: cartItem });
  } catch (error) {
    console.error("--- Add Item to Cart Error ---", { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to add item to cart.' });
  }
};

// --- UPDATE a cart item's quantity ---
const updateCartItemQuantity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: "A valid quantity greater than 0 is required." });
    }
    
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
        return res.status(404).json({ success: false, message: "Cart not found." });
    }

    const updatedItem = await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: parseInt(productId, 10),
        }
      },
      data: { quantity: parseInt(quantity, 10) },
    });

    res.status(200).json({ success: true, message: 'Cart item updated.', data: updatedItem });
  } catch (error) {
    console.error("--- Update Cart Item Error ---", { message: error.message });
    res.status(500).json({ success: false, message: 'Failed to update cart item.' });
  }
};

// --- REMOVE an item from the cart ---
const removeCartItem = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.params;

        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        await prisma.cartItem.delete({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId: parseInt(productId, 10),
                }
            }
        });
        
        res.status(200).json({ success: true, message: 'Item removed from cart.' });
    } catch (error) {
        console.error("--- Remove Cart Item Error ---", { message: error.message });
        res.status(500).json({ success: false, message: 'Failed to remove item from cart.' });
    }
};

// --- CLEAR the entire cart ---
const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            return res.status(200).json({ success: true, message: "Cart is already empty." });
        }

        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id }
        });

        res.status(200).json({ success: true, message: 'Cart cleared successfully.' });
    } catch (error) {
        console.error("--- Clear Cart Error ---", { message: error.message });
        res.status(500).json({ success: false, message: 'Failed to clear cart.' });
    }
};


module.exports = {
    getCart,
    addItemToCart,
    updateCartItemQuantity,
    removeCartItem,
    clearCart,
};
