const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const activityLogger = require('./middleware/activityLogger');

const app = express();
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://www.googletagmanager.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https:", "http:"], // Allow images from any secure source
            connectSrc: ["'self'", "https:", "http:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    frameguard: { action: 'deny' }
}));


const allowedOrigins = [
    'https://venthulir.com',
    'https://www.venthulir.com',
    'https://venthulir-1ehl.onrender.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:7000'
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Render internal)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(activityLogger); // Log all state-changing actions

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));

// API Diagnostic Routes
// 6. SERVE FRONTEND (Production)
if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../client/dist');
    
    // Serve admin static files
    app.use('/admin', express.static(path.join(distPath, 'admin')));
    
    // Serve customer static files
    app.use(express.static(distPath));

    // Admin SPA routing
    app.get('/admin/*', (req, res) => {
        res.sendFile(path.join(distPath, 'admin', 'index.html'));
    });

    // Customer SPA routing
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
} else {
    // API Diagnostic Routes (Development only)
    app.get('/', (req, res) => {
        res.json({
            status: 'Online',
            message: 'Venthulir Imperial API is running (Development Mode).',
            region: 'Local'
        });
    });
}

// Debug Email Route
app.get('/api/test-email', async (req, res) => {
    const transporter = require('./utils/email');
    const SENDER = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    try {
        await transporter.sendMail({
            from: `Venthulir Debug <${SENDER}>`,
            to: process.env.OWNER_EMAIL || process.env.EMAIL_USER,
            subject: 'Venthulir Email Connectivity Test',
            html: '<h2>✅ It works!</h2><p>Resend API is connected. All OTP emails will now reach customers.</p>'
        });
        res.json({ msg: '✅ Success! Test email sent to ' + (process.env.OWNER_EMAIL || process.env.EMAIL_USER) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        msg: 'Sovereign Server Error - Something went wrong.',
        error: process.env.NODE_ENV === 'production' ? err.message : err.stack
    });
});


module.exports = app;
