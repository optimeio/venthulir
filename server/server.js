require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 7000;

// Connect to Database
connectDB();

// Seeding logic (moved from index.js)
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const adminEmail = 'thesmgroups@gmail.com';
        const adminPass = 'TSMGPVT@2026';
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPass, salt);
            const newAdmin = new User({
                name: 'Imperial Admin',
                email: adminEmail,
                phone: '0000000000',
                password: hashedPassword,
                isAdmin: true
            });
            await newAdmin.save();
            console.log('💎 Royal Admin Account Secured and Synced (Modular).');
        }
    } catch (err) {
        console.error('Admin Seeding Error:', err);
    }
};

seedAdmin();

const backfillSlugs = async () => {
    try {
        const Product = require('./models/Product');
        const products = await Product.find({ $or: [{ slug: { $exists: false } }, { slug: "" }, { slug: null }] });
        if (products.length > 0) {
            for (let product of products) {
                // Pre-save hook generates the slug automatically
                await product.save();
            }
            console.log(`✅ Backfilled slugs for ${products.length} existing products.`);
        }
    } catch (err) {
        console.error('Slug Backfill Error:', err);
    }
};

backfillSlugs();

app.listen(PORT, () => {
    console.log(`🚀 Production Ready Server spinning at http://localhost:${PORT}`);

    // Keep-alive ping: prevents Render free tier cold starts (pings every 13 mins)
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
        const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://venthulir-1ehl.onrender.com';
        setInterval(async () => {
            try {
                const https = require('https');
                https.get(`${RENDER_URL}/`, (res) => {
                    console.log(`♻️ Keep-alive ping sent. Status: ${res.statusCode}`);
                }).on('error', (e) => {
                    console.warn('⚠️ Keep-alive ping failed:', e.message);
                });
            } catch (e) {
                console.warn('Keep-alive error:', e.message);
            }
        }, 13 * 60 * 1000); // Every 13 minutes
        console.log('♻️ Keep-alive scheduler activated (13-min interval)');
    }
});
