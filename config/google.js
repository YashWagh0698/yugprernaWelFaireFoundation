const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
process.env.CLIENT_ID,
process.env.CLIENT_SECRET,
process.env.REDIRECT_URI
);

const drive = google.drive({
version: 'v3',
auth: oauth2Client
});

const sheets = google.sheets({
version: 'v4',
auth: oauth2Client
});

module.exports = { oauth2Client, drive, sheets };
