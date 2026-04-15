const express = require('express');
const router = express.Router();
const { addBlog, getBlogs, sheetsStatus } = require('../controllers/blogController');

router.get('/blogs', getBlogs);       // GET  /api/blogs
router.get('/sheets-status', sheetsStatus); // GET /api/sheets-status
router.post('/add-blog', addBlog);    // POST /api/add-blog

module.exports = router;
