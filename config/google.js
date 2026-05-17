const { google } = require('googleapis');

// ✅ OAuth2 client create
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
);

// ✅ Fix 1: Refresh token set chesaru
oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

// ✅ Drive instance
const drive = google.drive({
    version: 'v3',
    auth: oauth2Client
});

// ✅ Sheets instance
const sheets = google.sheets({
    version: 'v4',
    auth: oauth2Client
});

module.exports = { oauth2Client, drive, sheets };
