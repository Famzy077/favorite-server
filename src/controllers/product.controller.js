const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// --- 1. CREATE a new Product ---
const createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity } = req.body;
    const image = req.file;

    if (!name || !price || !image) {
      return res.status(400).json({ success: false, message: 'Name, price, and image are required.' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        imageUrl: image.path, // Save the path to the image provided by Multer
        sellerId: req.user.id, // Link product to the logged-in admin
      },
    });

    res.status(201).json({ success: true, message: 'Product created successfully!', product: newProduct });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

//---READ all Products ---
const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc', // Show newest products first
      },
      include: {
        seller: { // Include seller info
          select: { email: true }
        }
      }
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("Get all products error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- READ a single Product by ID ---
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
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

// --- UPDATE a Product by ID ---
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, quantity } = req.body;
    const updateData = {};

    // Build the update object with only the fields that were provided
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = parseFloat(price);
    if (quantity) updateData.quantity = parseInt(quantity, 10);

    // Check if a new image file was uploaded
    if (req.file) {
        updateData.imageUrl = req.file.path;

        // Optional: Delete the old image to save space
        const productToUpdate = await prisma.product.findUnique({ where: { id } });
        if (productToUpdate && productToUpdate.imageUrl) {
            fs.unlink(path.join(__dirname, '..', '..', productToUpdate.imageUrl), (err) => {
                if (err) console.error("Error deleting old image:", err);
            });
        }
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id },
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

    // First, find the product to get its image path for deletion
    const productToDelete = await prisma.product.findUnique({ where: { id } });

    if (!productToDelete) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete the image file from the server
    if (productToDelete.imageUrl) {
        fs.unlink(path.join(__dirname, '..', '..', productToDelete.imageUrl), (err) => {
            if (err) console.error("Error deleting product image file:", err);
        });
    }

    // Then, delete the product record from the database
    await prisma.product.delete({
      where: { id },
    });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};