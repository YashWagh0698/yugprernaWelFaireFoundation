const express = require('express');
const router = express.Router();
const { submitContact, getMessages, markAsRead } = require('../controllers/contactController');

router.post('/contact', submitContact);          // POST /api/contact
router.get('/messages', getMessages);            // GET  /api/messages
router.patch('/messages/:id/read', markAsRead);  // PATCH /api/messages/:id/read

module.exports = router;
