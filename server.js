require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const blogRoutes = require('./routes/blogRoutes');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const session = require('express-session');

app.use(session({
secret: 'mysecret',
resave: false,
saveUninitialized: true,
cookie: {
secure: false
}
}));

// Routes
app.use('/auth', authRoutes);
app.use('/api', uploadRoutes);

app.get('/', (req, res) => {
res.send('Server Running 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});
