const multer = require('multer');
const path = require('path');

// ✅ File type check
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true); // ✅ accept
    } else {
        cb(new Error('Images only! (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    dest: 'uploads/',         // ✅ temp folder
    limits: {
        fileSize: 5 * 1024 * 1024  // ✅ 5MB max
    },
    fileFilter: fileFilter    // ✅ images only
});

module.exports = upload;
