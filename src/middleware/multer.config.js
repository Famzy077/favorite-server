    // const multer = require('multer');
    // const { storage } = require('../config/cloudinary.config');

    // // Initialize multer with the Cloudinary storage engine
    // const upload = multer({ storage });

    // module.exports = { upload };

    // In src/middleware/multer.config.js

const multer = require('multer');
const path = require('path');

// Configure Multer to use local disk storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Make sure you have an 'uploads' folder in your project's root directory
    cb(null, 'src/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with the local disk storage engine
const upload = multer({ storage });

module.exports = { upload };