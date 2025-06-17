    const multer = require('multer');
    const { storage } = require('../config/cloudinary.config');

    // Initialize multer with the Cloudinary storage engine
    const upload = multer({ storage });

    module.exports = { upload };