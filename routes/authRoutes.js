const express = require('express');
const router = express.Router();
const { oauth2Client } = require('../config/google');

// ✅ Admin check middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    return res.status(401).json({ error: 'Unauthorized. Login as admin first.' });
}

// Step 1: Redirect to Google Login (admin only)
router.get('/google', requireAdmin, (req, res) => { // ✅ Fix 3: admin only
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/drive',
            'https://www.googleapis.com/auth/spreadsheets'
        ],
        prompt: 'consent'
    });
    res.redirect(url);
});

// Step 2: Callback after Google Login
router.get('/google/callback', async (req, res) => {
    try {
        // ✅ Fix 2: Check code exists
        const code = req.query.code;
        if (!code) {
            return res.status(400).json({ error: 'Authorization code missing' });
        }

        // ✅ Fix 1: Try/catch added
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Save tokens in session
        req.session.tokens = tokens;

        // ✅ Warning fix: Redirect to dashboard
        res.redirect('/admin/dashboard');

    } catch (err) {
        console.error('❌ AUTH CALLBACK ERROR:', err.message);
        res.status(500).json({ error: 'Google authentication failed: ' + err.message });
    }
});

module.exports = router;
