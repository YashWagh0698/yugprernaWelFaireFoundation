require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;
const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// Session MUST be registered before routes so req.session is available in controllers
app.use(session({
secret: 'mysecret',
resave: false,
saveUninitialized: false,
store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
cookie: {
secure: true,
sameSite: 'none'
}
}));

app.use(express.static('public'));
app.use(express.static('admin', { index: false })); // serve admin html files

// Routes
app.use('/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', blogRoutes); // ← THIS WAS MISSING — caused all /api/add-blog calls to 404

// Admin login endpoint
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        req.session.isAdmin = true;
        return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// Middleware to protect admin pages
function requireAdmin(req, res, next) {
    if (req.session && req.session.isAdmin) return next();
    res.status(401).json({ error: 'Unauthorized' });
}

// Protected admin routes (optional — add requireAdmin if you want auth)
app.get('/admin', (req, res) => res.sendFile('login.html', { root: 'admin' }));
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
    console.log(`Server running on port ${PORT}`);
});
