// ℹ️ Handles file upload via forms
const multer = require('multer');
const path = require('path');

// Set storage engine for multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/uploads'); // Directory where uploaded files will be stored
    },
    filename: function (req, file, cb) {
      cb(null, 'pfp-' + Date.now() + path.extname(file.originalname)); // File naming convention
    }
});
  
// Initialize multer upload middleware
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // Limit file size to 10MB (adjust as needed)
});

module.exports = upload;