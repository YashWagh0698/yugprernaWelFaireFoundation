const express = require('express');
const router = express.Router();
const { submitContact, getMessages, markAsRead } = require('../controllers/contactController');

// ✅ Admin check middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.status(401).json({ error: 'Unauthorized. Admin access required.' });
}

// ✅ Public route - anyone can submit contact form
router.post('/contact', submitContact);

// ✅ Admin only routes
router.get('/messages', requireAdmin, getMessages);
router.patch('/messages/:id/read', requireAdmin, markAsRead);

module.exports = router;
