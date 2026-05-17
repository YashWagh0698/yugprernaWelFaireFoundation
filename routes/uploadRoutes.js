const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadFile } = require('../controllers/uploadController');
const requireAdmin = require('../middleware/requireAdmin'); // ✅ separate middleware

// ✅ Multer error handler
function handleMulterError(err, req, res, next) {
    if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large! Max 5MB allowed.' });
        }
        return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
}

// ✅ Admin only + multer error handled
router.post(
    '/upload',
    requireAdmin,                    // ✅ Fix 1: admin only
    upload.single('file'),           // ✅ multer middleware
    handleMulterError,               // ✅ Fix 2: multer error handler
    uploadFile                       // ✅ controller
);

module.exports = router;
