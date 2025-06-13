const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// --- 1. CREATE a new Product ---
const createProduct = async (req, res) => {
  try {
    const { name, description, price, oldPrice, quantity, category } = req.body;
    const imageFile = req.file;

    if (!name || !price || !category || !imageFile) {
      return res.status(400).json({ success: false, message: 'Name, price, category, and image are required.' });
    }

    const imagePath = imageFile.path.replace(/\\/g, "/");

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        category,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        image: imagePath,
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

// --- 4. UPDATE a Product by ID ---
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, oldPrice, category, quantity } = req.body;
    
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (price) updateData.price = parseFloat(price);
    if (oldPrice) updateData.oldPrice = parseFloat(oldPrice);
    if (quantity) updateData.quantity = parseInt(quantity, 10);

    if (req.file) {
      const imagePath = req.file.path.replace(/\\/g, "/");
      updateData.image = imagePath;

      const productToUpdate = await prisma.product.findUnique({ where: { id: productId } });
      if (productToUpdate && productToUpdate.image) {
        fs.unlink(path.join(__dirname, '..', '..', productToUpdate.image), (err) => {
          if (err) console.error("Error deleting old image:", err);
        });
      }
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

// --- 5. DELETE a Product by ID ---
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const productToDelete = await prisma.product.findUnique({ where: { id: productId } });

    if (!productToDelete) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (productToDelete.image) {
        fs.unlink(path.join(__dirname, '..', '..', productToDelete.image), (err) => {
            if (err) console.error("Error deleting product image file:", err);
        });
    }

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
