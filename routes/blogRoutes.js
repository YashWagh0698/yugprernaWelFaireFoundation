const express = require('express');
const router = express.Router();
const { addBlog, getBlogs } = require('../controllers/blogController');

router.get('/blogs', getBlogs);       // GET  /api/blogs
router.post('/add-blog', addBlog);    // POST /api/add-blog

module.exports = router;
