const express = require('express');
const router = express.Router();
const { addBlog, getBlogs, sheetsStatus } = require('../controllers/blogController');

// ✅ Admin check middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
}

// ✅ Public route - anyone can read blogs
router.get('/blogs', getBlogs);

// ✅ Admin only routes
router.post('/add-blog', requireAdmin, addBlog);
router.get('/sheets-status', requireAdmin, sheetsStatus);

module.exports = router;
