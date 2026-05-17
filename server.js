require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo'); // ✅ Fix 1: removed .default
const mongoose = require('mongoose'); // ✅ Fix 2: added mongoose
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const blogRoutes = require('./routes/blogRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();

// ✅ Fix 3: MongoDB connection added
if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is missing in .env!');
    process.exit(1);
}

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    });

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'mysecret', // ✅ Fix 4: env variable
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',  // ✅ Fix 5: not always true
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

app.use(express.static('public'));
app.use(express.static('admin', { index: false }));

// Routes
app.use('/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', blogRoutes);
app.use('/api', contactRoutes);

// Public config endpoint
app.get('/api/config', (req, res) => {
    const logoId = process.env.website_logo;
    res.json({
        logoUrl: logoId ? `https://drive.google.com/uc?id=${logoId}` : null
    });
});

// Admin login
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const adminUser = process.env.ADMIN_USER?.trim();
    const adminPass = process.env.ADMIN_PASS?.trim();
    if (username?.trim() === adminUser && password?.trim() === adminPass) {
        req.session.isAdmin = true;
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Admin auth middleware
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

// Admin page routes
app.get('/admin', (req, res) => res.sendFile('login.html', { root: 'admin' }));
app.get('/admin/login', (req, res) => res.sendFile('login.html', { root: 'admin' }));
app.get('/admin/dashboard', requireAdmin, (req, res) =>
    res.sendFile('dashboard.html', { root: 'admin' })
);
app.get('/admin/add-blog', requireAdmin, (req, res) =>
    res.sendFile('add-blog.html', { root: 'admin' })
);
app.get('/admin/add-project', requireAdmin, (req, res) =>
    res.sendFile('add-project.html', { root: 'admin' })
);

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
