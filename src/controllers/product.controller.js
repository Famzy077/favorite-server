const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary.config');

// --- 1. CREATE a new Product (Polished Version) ---
const createProduct = async (req, res) => {
  console.log("📦 req.file:", JSON.stringify(req.file, null, 2));
  console.log("📦 req.file:", req.file);


  try {
    const { name, description, price, oldPrice, quantity, category } = req.body;
    
    // Check for the uploaded file first
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Product image is required.' });
    }

    // More specific validation for required text fields
    if (!name || !price || !category) {
        return res.status(400).json({ success: false, message: "Name, price, and category are required." });
    }
    
    // Create the new product in the database
    const newProduct = await prisma.product.create({
      data: {
        name,
        description: description || null,
        category,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        quantity: quantity ? parseInt(quantity, 10) : 1,
        image: req.file.path,       // Full URL from Cloudinary
        publicId: req.file.filename,  // Unique ID from Cloudinary
        sellerId: req.user.id,      // The ID of the logged-in admin
      },
    });

    res.status(201).json({ success: true, message: 'Product created successfully!', product: newProduct });
  } catch (error) {
    // --- THIS IS THE MOST IMPORTANT PART ---
    // This detailed log will show the real error in your Render console
    console.log("--- CREATE PRODUCT CRASH ---", { 
        errorMessage: error.message, 
        errorStack: error.stack,
        requestBody: req.body,
        requestFile: req.file 
    });

    // If the database query failed after the image was uploaded, we should delete the orphaned image from Cloudinary
    if (req.file) {
        try {
            await cloudinary.uploader.destroy(req.file.filename);
            console.log("Orphaned image deleted from Cloudinary:", req.file.filename);
        } catch (cloudinaryError) {
            console.log("Failed to delete orphaned image from Cloudinary:", cloudinaryError);
        }
    }
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
    // FIX: Improved logging
    console.error("--- Get All Products Error ---", { message: error.message, stack: error.stack });
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
    // FIX: Improved logging
    console.error("--- Get Product By ID Error ---", { message: error.message, stack: error.stack, params: req.params });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// --- 4. UPDATE a Product by ID (Cloudinary Version) ---
const updateProduct = async (req, res) => {
  console.log("📦 req.file:", JSON.stringify(req.file, null, 2));


  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID." });
    }

    const existingProduct = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const { name, description, price, oldPrice, category, quantity } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (category) updateData.category = category;
    if (price) updateData.price = parseFloat(price);
    // Allow setting oldPrice to null or empty
    if (oldPrice !== undefined) updateData.oldPrice = oldPrice ? parseFloat(oldPrice) : null;
    if (quantity) updateData.quantity = parseInt(quantity, 10);

    if (req.file) {
      if (existingProduct.publicId) {
        try {
          await cloudinary.uploader.destroy(existingProduct.publicId);
        } catch (cloudinaryError) {
          console.error("Cloudinary Deletion Error on Update:", cloudinaryError);
        }
      }
      updateData.image = req.file.path;
      updateData.publicId = req.file.filename;
    }
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updateData,
    });

    res.status(200).json({ success: true, message: 'Product updated successfully!', product: updatedProduct });
  } catch (error) {
    // Detailed logging for the update function
    console.error("--- UPDATE PRODUCT CRASH ---", {
      errorMessage: error.message,
      errorStack: error.stack,
      requestParams: req.params,
      requestBody: req.body,
    });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
;}

// --- 5. DELETE a Product by ID (Cloudinary Version) ---
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    const productToDelete = await prisma.product.findUnique({ where: { id: productId } });

    if (!productToDelete) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (productToDelete.publicId) {
      await cloudinary.uploader.destroy(productToDelete.publicId);
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    // FIX: Improved logging
    console.error("--- Delete Product Error ---", { message: error.message, stack: error.stack, params: req.params });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- 6. Search Product ---
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    // FIX: Improved logging
    console.error("--- Search Products Error ---", { message: error.message, stack: error.stack, query: req.query });
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
