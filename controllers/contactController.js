const { sheets, oauth2Client } = require('../config/google');

const SHEET_RANGE = 'Sheet1!A:I';
// Columns: A=id, B=name, C=org, D=email, E=enquiry_type, F=message, G=created_at, H=is_read

function getSheetId() {
    const id = process.env.user_messages;
    if (!id) throw new Error('user_messages sheet ID not set in .env');
    return id;
}

// Ensure the sheet has a header row; if empty, write headers first
async function ensureHeaders() {
    const spreadsheetId = getSheetId();
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Sheet1!A1:H1'
    });
    const row = res.data.values && res.data.values[0];
    if (!row || row[0] !== 'id') {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet1!A1:H1',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [['id', 'name', 'org', 'email', 'enquiry_type', 'message', 'created_at', 'is_read']]
            }
        });
    }
}

// POST /api/contact
exports.submitContact = async (req, res) => {
    try {
        if (!req.session || !req.session.tokens) {
            // For public contact form we still need auth tokens.
            // If your server uses a service account or server-side auth, adjust here.
            // For now, return a friendly error so the admin knows to authenticate first.
            return res.status(503).json({ error: 'Server not authenticated with Google. Admin must visit /auth/google first.' });
        }

        oauth2Client.setCredentials(req.session.tokens);

        const { name, org, email, enquiry_type, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'name, email, and message are required.' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email address.' });
        }

        await ensureHeaders();

        // Generate a simple unique ID: timestamp + random suffix
        const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        await sheets.spreadsheets.values.append({
            spreadsheetId: getSheetId(),
            range: SHEET_RANGE,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [[
                    id,
                    name.trim(),
                    (org || '').trim(),
                    email.trim().toLowerCase(),
                    (enquiry_type || '').trim(),
                    message.trim(),
                    new Date().toISOString(),
                    'false'   // is_read default false
                ]]
            }
        });

        res.json({ success: true, message: 'Message received. We will get back to you within 2 working days.' });

    } catch (err) {
        console.error('CONTACT SUBMIT ERROR:', err.message);
        res.status(500).json({ error: err.message || 'Failed to save message.' });
    }
};

// GET /api/messages  (admin only — caller should add requireAdmin middleware in server.js)
exports.getMessages = async (req, res) => {
    try {
        if (!req.session || !req.session.tokens) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!req.session.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        oauth2Client.setCredentials(req.session.tokens);

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: getSheetId(),
            range: SHEET_RANGE
        });

        const rows = response.data.values || [];
        // Skip header row
        const messages = rows
            .slice(1)
            .filter(row => row[0] && row[0] !== 'id')
            .map((row, idx) => ({
                _rowIndex: idx + 2, // 1-based, +1 for header
                id:           row[0] || '',
                name:         row[1] || '',
                org:          row[2] || '',
                email:        row[3] || '',
                enquiry_type: row[4] || '',
                message:      row[5] || '',
                created_at:   row[6] || '',
                is_read:      row[7] === 'true'
            }))
            // Latest first
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        const unread_count = messages.filter(m => !m.is_read).length;
        res.json({ messages, unread_count });

    } catch (err) {
        console.error('GET MESSAGES ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/messages/:id/read
exports.markAsRead = async (req, res) => {
    try {
        if (!req.session || !req.session.tokens) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        if (!req.session.isAdmin) {
            return res.status(403).json({ error: 'Admin access required' });
        }

        oauth2Client.setCredentials(req.session.tokens);

        const { id } = req.params;
        const spreadsheetId = getSheetId();

        // Fetch all rows to find the right one
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: SHEET_RANGE
        });

        const rows = response.data.values || [];
        const rowIdx = rows.findIndex((row, i) => i > 0 && row[0] === id);

        if (rowIdx === -1) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // rowIdx is 0-based in the array; Sheet row = rowIdx + 1 (1-based sheets)
        const sheetRow = rowIdx + 1;

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!H${sheetRow}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['true']] }
        });

        res.json({ success: true });

    } catch (err) {
        console.error('MARK READ ERROR:', err.message);
        res.status(500).json({ error: err.message });
    }
};
