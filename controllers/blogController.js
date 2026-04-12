const { sheets, oauth2Client } = require('../config/google');

// POST /api/add-blog
exports.addBlog = async (req, res) => {
    try {
        // Tokens must exist — user must have gone through /auth/google first
        if (!req.session || !req.session.tokens) {
            return res.status(401).json({ error: 'Not authenticated. Please visit /auth/google first.' });
        }

        oauth2Client.setCredentials(req.session.tokens);

        const { title, description, image, video, social_link } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'title and description are required' });
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: 'Sheet1!A:F',          // A=title B=desc C=image D=video E=social F=timestamp
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    title,
                    description,
                    image || '',
                    video || '',
                    social_link || '',
                    new Date().toISOString()  // timestamp column so you can sort
                ]]
            }
        });

        res.json({ success: true });

    } catch (err) {
        console.error('SHEET WRITE ERROR:', err.message);
        // Surface the real Google error to the frontend so you can debug it
        res.status(500).json({ error: err.message });
    }
};

// GET /api/blogs  — read all rows back out
exports.getBlogs = async (req, res) => {
    try {
        if (!req.session || !req.session.tokens) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        oauth2Client.setCredentials(req.session.tokens);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: 'Sheet1!A:F'
        });

        const rows = response.data.values || [];
        // Skip header row if present, map to objects
        const blogs = rows
            .filter(row => row[0] && row[0] !== 'title') // skip blank / header rows
            .map(row => ({
                title: row[0] || '',
                description: row[1] || '',
                image: row[2] || '',
                video: row[3] || '',
                social_link: row[4] || '',
                created_at: row[5] || ''
            }));

        res.json(blogs);

    } catch (err) {
        console.error('SHEET READ ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
};
