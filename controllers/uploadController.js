const fs = require('fs');
const { drive, oauth2Client } = require('../config/google');

exports.uploadFile = async (req, res) => {
    let filePath = null; // ✅ track filePath for finally block

    try {
        console.log("SESSION:", req.session);
        console.log("TOKENS:", req.session.tokens);

        // ✅ Fix 4: Better session check
        if (!req.session || !req.session.tokens) {
            return res.status(401).json({ error: 'Not authenticated. Visit /auth/google first.' });
        }

        // ✅ Fix 1: Check file exists before using
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // ✅ Fix 3: Check BLOG_IMAGE_FOLDER
        if (!process.env.BLOG_IMAGE_FOLDER) {
            return res.status(500).json({ error: 'BLOG_IMAGE_FOLDER not set in .env' });
        }

        oauth2Client.setCredentials(req.session.tokens);

        filePath = req.file.path; // ✅ assign here for finally block

        const response = await drive.files.create({
            requestBody: {
                name: req.file.originalname,
                parents: [process.env.BLOG_IMAGE_FOLDER]
            },
            media: {
                mimeType: req.file.mimetype,
                body: fs.createReadStream(filePath)
            }
        });

        // Make file public
        await drive.permissions.create({
            fileId: response.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone'
            }
        });

        const fileUrl = `https://drive.google.com/uc?id=${response.data.id}`;

        res.json({ url: fileUrl });

    } catch (err) {
        console.error("❌ UPLOAD ERROR:", err.message);
        console.error(err);
        res.status(500).json({ error: 'Upload failed: ' + err.message });

    } finally {
        // ✅ Fix 2: Always delete temp file
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('🗑️ Temp file deleted:', filePath);
        }
    }
};
