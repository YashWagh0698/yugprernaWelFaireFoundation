const { sheets, oauth2Client } = require('../config/google');

// ✅ Check SHEET_ID at startup
if (!process.env.SHEET_ID) {
    console.error('❌ SHEET_ID missing in .env!');
    process.exit(1);
}

// ✅ Reusable auth middleware function
function setAuth(req) {
    oauth2Client.setCredentials(req.session.tokens);
}

// ✅ Check session tokens
function isAuthenticated(req, res) {
    if (!req.session || !req.session.tokens) {
        res.status(401).json({ error: 'Not authenticated. Please visit /auth/google first.' });
        return false;
    }
    return true;
}

// POST /api/add-blog
exports.addBlog = async (req, res) => {
    try {
        if (!isAuthenticated(req, res)) return;
        setAuth(req);

        const { title, description, image, video, social_link } = req.body;

        if (!title || !description) {
            return res.status(400).json({ error: 'title and description are required' });
        }

        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.SHEET_ID,
            range: 'Sheet1!A:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    title,
                    description,
                    image || '',
                    video || '',
                    social_link || '',
                    new Date().toISOString()
                ]]
            }
        });

        res.json({ success: true });

    } catch (err) {
        console.error('❌ SHEET WRITE ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/blogs
exports.getBlogs = async (req, res) => {
    try {
        if (!isAuthenticated(req, res)) return;
        setAuth(req);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: 'Sheet1!A:F'
        });

        const rows = response.data.values || [];

        const blogs = rows
            .filter(row => row[0] && row[0] !== 'title') // ✅ skips header row
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
        console.error('❌ SHEET READ ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/sheets-status
exports.sheetsStatus = async (req, res) => {
    try {
        if (!isAuthenticated(req, res)) return;
        setAuth(req);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SHEET_ID,
            range: 'Sheet1!A1:A1'
        });

        res.json({
            ok: true,
            sheetId: process.env.SHEET_ID,
            sample: (response.data.values && response.data.values[0]) || []
        });

    } catch (err) {
        console.error('❌ SHEET STATUS ERROR:', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
};
