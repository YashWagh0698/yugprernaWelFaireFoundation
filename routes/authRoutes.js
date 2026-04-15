const express = require('express');
const router = express.Router();
const { oauth2Client } = require('../config/google');

// Step 1: Redirect to Google Login
router.get('/google', (req, res) => {
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

// Step 2: Callback after login
router.get('/google/callback', async (req, res) => {
const code = req.query.code;

const { tokens } = await oauth2Client.getToken(code);

oauth2Client.setCredentials(tokens);

// Save tokens in session
req.session.tokens = tokens;

res.send('Google Auth Successful ✅ You can close this tab.');

});

module.exports = router;
