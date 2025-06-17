// In src/controllers/product.controller.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary.config');

// Helper function to add a display image for the frontend
const addDisplayImage = (product) => {
    // This function ensures the frontend always has a consistent 'image' property to use.
    if (product && product.images && product.images.length > 0) {
        return { ...product, image: product.images[0].url };
    }
    // Provide a generic fallback path for products that might not have an image
    return { ...product, image: '/default-placeholder.png' };
};

// --- CREATE a new Product with Multiple Images ---
const createProduct = async (req, res) => {
  try {
    const { name, description, price, oldPrice, quantity, category } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one product image is required.' });
    }
    if (!name || !price || !category) {
      return res.status(400).json({ success: false, message: "Name, price, and category are required." });
    }
    
    const newProductWithImages = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name,
          description: description || null,
          category,
          price: parseFloat(price),
          oldPrice: oldPrice ? parseFloat(oldPrice) : null,
          quantity: quantity ? parseInt(quantity, 10) : 1,
          sellerId: req.user.id,
        },
      });

      const imageCreations = files.map(file => 
        tx.productImage.create({
          data: {
            productId: product.id,
            url: file.path,       // Full URL from Cloudinary
            publicId: file.filename,  // Unique ID from Cloudinary
          }
        })
      );
      await Promise.all(imageCreations);

      return tx.product.findUnique({
          where: { id: product.id },
          include: { images: true }
      });
    });

    res.status(201).json({ success: true, message: 'Product created successfully!', product: addDisplayImage(newProductWithImages) });
  } catch (error) {
    console.error("--- CREATE PRODUCT CRASH ---", { errorMessage: error.message, errorStack: error.stack });
    if (req.files) {
      req.files.forEach(async (file) => {
        try { await cloudinary.uploader.destroy(file.filename); }
        catch (e) { console.error("Failed to delete orphaned image from Cloudinary:", e); }
      });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// --- UPDATE a Product with Multiple Images ---
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product ID." });
    }

    const { name, description, price, oldPrice, category, quantity } = req.body;
    const files = req.files;

    const updatedProduct = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: productId },
        data: {
          name: name || undefined,
          description: description || undefined,
          price: price ? parseFloat(price) : undefined,
          oldPrice: oldPrice !== undefined ? (oldPrice ? parseFloat(oldPrice) : null) : undefined,
          category: category || undefined,
          quantity: quantity ? parseInt(quantity, 10) : undefined,
        },
      });

      // If new images were uploaded, this replaces all old images
      if (files && files.length > 0) {
        const oldImages = await tx.productImage.findMany({ where: { productId: productId } });
        
        if (oldImages.length > 0) {
          const publicIds = oldImages.map(img => img.publicId).filter(id => id);
          if (publicIds.length > 0) {
            await cloudinary.api.delete_resources(publicIds);
          }
        }

        await tx.productImage.deleteMany({ where: { productId: productId } });

        const imageCreations = files.map(file => 
          tx.productImage.create({
            data: { productId: productId, url: file.path, publicId: file.filename }
          })
        );
        await Promise.all(imageCreations);
      }
      
      return tx.product.findUnique({
          where: { id: product.id },
          include: { images: true }
      });
    });

    res.status(200).json({ success: true, message: 'Product updated successfully!', product: addDisplayImage(updatedProduct) });
  } catch (error) {
    console.error("--- UPDATE PRODUCT CRASH ---", { errorMessage: error.message, errorStack: error.stack });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


// --- Your other functions ---
const getAllProducts = async (req, res) => {
    try {
        const productsFromDb = await prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: { images: true }
        });
        const products = productsFromDb.map(addDisplayImage);
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error("--- Get All Products Error ---", { errorMessage: error.message });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id, 10);
        if (isNaN(productId)) { return res.status(400).json({ success: false, message: 'Invalid product ID.' }); }
        
        const productFromDb = await prisma.product.findUnique({
            where: { id: productId },
            include: { images: true }
        });
        if (!productFromDb) { return res.status(404).json({ success: false, message: 'Product not found' }); }
        
        const product = addDisplayImage(productFromDb);
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error("--- Get Product By ID Error ---", { errorMessage: error.message });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id, 10);
        if (isNaN(productId)) { return res.status(400).json({ success: false, message: "Invalid product ID." }); }

        const productToDelete = await prisma.product.findUnique({
            where: { id: productId },
            include: { images: true },
        });
        if (!productToDelete) { return res.status(404).json({ success: false, message: "Product not found" }); }

        if (productToDelete.images && productToDelete.images.length > 0) {
            const publicIds = productToDelete.images.map(image => image.publicId).filter(id => id);
            if (publicIds.length > 0) {
                await cloudinary.api.delete_resources(publicIds);
            }
        }
        
        await prisma.product.delete({ where: { id: productId } });
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        console.error("--- Delete Product Error ---", { errorMessage: error.message });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

const searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) { return res.status(200).json({ success: true, data: [] }); }

        const productsFromDb = await prisma.product.findMany({
            where: { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] },
            take: 10,
            include: { images: true }
        });
        const products = productsFromDb.map(addDisplayImage);
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        console.error("--- Search Products Error ---", { errorMessage: error.message });
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
  createProduct,
  updateProduct,
  getAllProducts,
  getProductById,
  deleteProduct,
  searchProducts,
};
