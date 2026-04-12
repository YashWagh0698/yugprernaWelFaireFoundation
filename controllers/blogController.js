const { sheets, oauth2Client } = require('../config/google');

exports.addBlog = async (req, res) => {
try {
oauth2Client.setCredentials(req.session.tokens);

    const { title, description, image, video, social_link } = req.body;

    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SHEET_ID,
        range: 'Sheet1!A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[title, description, image, video, social_link]]
        }
    });

    res.json({ success: true });

} catch (err) {
    console.error("SHEET ERROR:", err);
    res.status(500).send('Failed to save blog');
}

};
