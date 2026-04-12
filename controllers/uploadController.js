const fs = require('fs');
const { drive, oauth2Client } = require('../config/google');

exports.uploadFile = async (req, res) => {
try {
console.log("SESSION:", req.session);
console.log("TOKENS:", req.session.tokens);

    if (!req.session.tokens) {
        return res.status(401).send("Not authenticated");
    }

    oauth2Client.setCredentials(req.session.tokens);

    const filePath = req.file.path;

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

    await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    const fileUrl = `https://drive.google.com/uc?id=${response.data.id}`;

    fs.unlinkSync(filePath);

    res.json({ url: fileUrl });

} catch (err) {
    console.error("UPLOAD ERROR:", err.message);
    console.error(err);
    res.status(500).send('Upload failed');
}

};
