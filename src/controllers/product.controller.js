const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { cloudinary } = require('../config/cloudinary.config');


// --- Helper function to add a display image to a product ---
const addDisplayImage = (product) => {
    if (product.images && product.images.length > 0) {
        return { ...product, image: product.images[0].url };
    }
    // Provide a fallback if there are no images
    return { ...product, image: '/path/to/your/default/placeholder.png' };
};

// --- 1. CREATE a new Product with Multiple Images ---
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
    
    // Use a transaction to ensure either everything succeeds or nothing does
    const newProductWithImages = await prisma.$transaction(async (tx) => {
      // First, create the product
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

      // Then, create the ProductImage records for each uploaded image
      const imageCreations = files.map(file => 
        tx.productImage.create({
          data: {
            productId: product.id,
            url: file.path,
            publicId: file.filename,
          }
        })
      );
      
      // Wait for all image records to be created
      await Promise.all(imageCreations);

      // Return the product with its newly created images
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

// --- 2. READ all Products with their images ---
const getAllProducts = async (req, res) => {
  try {
    const productsFromDb = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { images: true },
    });
    const products = productsFromDb.map(addDisplayImage);
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("--- Get All Products Error ---", { message: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- 3 READ a single Product by ID (with Images) ---
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);
    if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
    }

    const productFromDb = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });

    if (!productFromDb) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const product = addDisplayImage(productFromDb);

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error("--- Get Product By ID Error ---", { message: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- 4. UPDATE a Product (This is now a more complex operation) ---
const updateProduct = async (req, res) => {
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
    const files = req.files;
    
    // We can update text fields directly
    const updatedProduct = await prisma.product.update({
        where: { id: productId },
        data: {
          name: name || undefined,
          description: description || undefined,
          price: price ? parseFloat(price) : undefined,
          oldPrice: oldPrice ? parseFloat(oldPrice) : undefined,
          category: category || undefined,
          quantity: quantity ? parseInt(quantity, 10) : 1,
        }
    });

    // If new images were uploaded, add them to the product
    if (files && files.length > 0) {
        const imageCreations = files.map(file => {
          return prisma.productImage.create({
            data: {
              productId: productId,
              url: file.path,
              publicId: file.filename,
            }
          });
        });
        await Promise.all(imageCreations);
    }

    res.status(200).json({ success: true, message: 'Product updated successfully!', product: updatedProduct });
  } catch (error) {
    console.error("--- UPDATE PRODUCT CRASH ---", { errorMessage: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- 5. DELETE a Product and all its Cloudinary images ---
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const productId = parseInt(id, 10);

    const productToDelete = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true }, // Get the images to delete them from Cloudinary
    });

    if (!productToDelete) {
        return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Delete all associated images from Cloudinary
    if (productToDelete.images && productToDelete.images.length > 0) {
      const publicIds = productToDelete.images.map(image => image.publicId);
      await cloudinary.api.delete_resources(publicIds);
    }

    // The database will cascade delete the ProductImage records,
    // so we only need to delete the main product.
    await prisma.product.delete({ where: { id: productId } });

    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error("--- Delete Product Error ---", { message: error.message });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// --- Search Product (with Images) ---
const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const productsFromDb = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { category: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      include: { images: true },
    });

    const products = productsFromDb.map(addDisplayImage);

    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error("--- Search Products Error ---", { message: error.message });
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