const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary.config');

// --- 1. CREATE a new Product (Cloudinary Version) ---
const createProduct = async (req, res) => {
  try {
    const { name, description, price, oldPrice, quantity, category } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image is required.' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        category,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        image: req.file.path, // The full URL from Cloudinary
        publicId: req.file.filename, // The unique public_id from Cloudinary
        sellerId: req.user.id,
      },
    });

    res.status(201).json({ success: true, message: 'Product created successfully!', product: newProduct });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- 2. READ all Products ---
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- 3. READ a single Product by ID ---
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// --- 4. UPDATE a Product by ID (Cloudinary Version) ---
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, oldPrice, category, quantity } = req.body;
    const productId = parseInt(id, 10);

    const updateData = {};
    if (name) updateData.name = name;
    // ... etc for other text fields

    // If a new file is uploaded, update the image and publicId
    if (req.file) {
      // Find the old product to delete its image from Cloudinary
      const oldProduct = await prisma.product.findUnique({ where: { id: productId } });
      if (oldProduct && oldProduct.publicId) {
        await cloudinary.uploader.destroy(oldProduct.publicId);
      }
      // Update with new image details
      updateData.image = req.file.path;
      updateData.publicId = req.file.filename;
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    res.status(200).json({ success: true, message: 'Product updated successfully!', product: updatedProduct });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};



// --- 5. DELETE a Product by ID (Cloudinary Version) ---
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    // First, find the product to get its publicId
    const productToDelete = await prisma.product.findUnique({ where: { id: productId } });

    if (!productToDelete) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    // If a publicId exists, delete the image from Cloudinary
    if (productToDelete.publicId) {
      await cloudinary.uploader.destroy(productToDelete.publicId);
    }

    // Then, delete the product record from the database
    await prisma.product.delete({
      where: { id: productId },
    });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Search Product
const searchProducts = async (req, res) => {
  // It will tell us if the function is being called and what query it received.
  // console.log('Search function initiated. Query params received:', req.query);

  try {
    const { q } = req.query;

    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: q,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: q,
              mode: 'insensitive',
            },
          },
        ],
      },
      take: 10,
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Search products error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  searchProducts,
};