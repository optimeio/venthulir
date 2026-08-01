const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');
const Message = require('../models/Message');
const ActivityLog = require('../models/ActivityLog');
const { clearProductsCache } = require('./productController');
// Shared transporter used instead



exports.getLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};

const transporter = require('../utils/email');

const LOGO_URL = 'https://i.ibb.co/rGZwVGYP/organic.png';
const DELIVERY_PHONE = process.env.DELIVERY_PHONE || '8778476414';

exports.getStats = async (req, res) => {
    try {
        const productCount = await Product.countDocuments();
        const userCount = await User.countDocuments({ email: { $ne: 'thesmgroups@gmail.com' } });
        const orderCount = await Order.countDocuments();
        const messageCount = await Message.countDocuments({ status: 'Open' });
        const lowStockCount = await Product.countDocuments({ currentStock: { $gt: 0, $lt: 10 } });
        const outOfStockCount = await Product.countDocuments({ currentStock: 0 });

        res.json({ productCount, userCount, orderCount, messageCount, lowStockCount, outOfStockCount });
    } catch (err) {
        res.status(500).json({ error: 'Stats Error' });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({ email: { $ne: 'thesmgroups@gmail.com' } }).sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.email === 'thesmgroups@gmail.com') return res.status(403).json({ error: 'Cannot delete admin account' });
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Customer deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete customer' });
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ error: 'Order not found' });
        await Order.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Order deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete order' });
    }
};

exports.getAdminProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        const currentDomain = `${req.protocol}://${req.get('host')}`;
        const fixedProducts = products.map(p => {
            const product = p.toObject();
            if (product.imageUrl && typeof product.imageUrl === 'string' && (product.imageUrl.includes('onrender.com') || product.imageUrl.includes('localhost:7000'))) {
                product.imageUrl = product.imageUrl.replace(/https?:\/\/[^/]+/, currentDomain);
            }
            if (product.images) {
                product.images = product.images.map(img => (img && typeof img === 'string' && (img.includes('onrender.com') || img.includes('localhost:7000'))) ? img.replace(/https?:\/\/[^/]+/, currentDomain) : img);
            }
            return product;
        });
        res.json(fixedProducts);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.addProduct = async (req, res) => {
    try {
        const { productCode, name, price, description, imageUrl, images, category, badge, shippingCharge, variants, initialStock, originalPrice, discountPercent, hsnSac } = req.body;
        const stock = parseInt(initialStock) || 0;
        const newProduct = new Product({
            productCode,
            name, price, description,
            imageUrl: imageUrl || (images && images.length > 0 ? images[0] : ''),
            images: images || [],
            category, badge,
            shippingCharge: parseInt(shippingCharge) || 0,
            originalPrice: parseFloat(originalPrice) || undefined,
            discountPercent: parseFloat(discountPercent) || undefined,
            variants: variants || [],
            initialStock: stock,
            currentStock: stock,  // currentStock starts equal to initialStock
            hsnSac: hsnSac || ""
        });
        await newProduct.save();
        clearProductsCache();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'Product not found' });

        // Update fields
        Object.assign(product, req.body);
        if (req.body.hsnSac !== undefined) {
            product.hsnSac = req.body.hsnSac;
        }
        product.updatedAt = new Date();

        // If initialStock is being changed, sync currentStock too
        if (req.body.initialStock !== undefined) {
            product.currentStock = parseInt(req.body.initialStock) || 0;
        }

        await product.save();
        clearProductsCache();
        res.json(product);
    } catch (err) {
        console.error('Update Product Error:', err);
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        clearProductsCache();
        res.json({ msg: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.uploadImages = (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No images' });
        const protocol = req.protocol;
        const host = req.get('host');
        const imageUrls = req.files.map(file => `${protocol}://${host}/uploads/${file.filename}`);
        res.json({ imageUrls });
    } catch (err) {
        res.status(500).json({ error: 'Upload Error' });
    }
};

exports.resolveMessage = async (req, res) => {
    try {
        const { reply } = req.body;
        const message = await Message.findById(req.params.id);
        if (!message) return res.status(404).json({ error: 'Query not found' });

        message.status = 'Resolved';
        message.reply = reply || 'Your request has been processed.';
        message.resolvedAt = new Date();
        await message.save();

        if (reply) {
            const mailOptions = {
                from: `Venthulir Official <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                to: message.customerEmail,
                subject: 'Response to your Query — Venthulir Royal Reserves',
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 12px; overflow: hidden;">
                        <div style="background: #0b3d2e; padding: 30px; text-align: center;">
                            <img src="${LOGO_URL}" alt="Venthulir Logo" style="height: 70px; display: block; margin: 0 auto;">
                        </div>
                        <div style="padding: 40px; color: #333;">
                            <p>Dear <strong>${message.customerName}</strong>,</p>
                            <p>Thank you for reaching out to us. Here is our response to your query:</p>
                            <div style="background: #fdfcf7; border-left: 4px solid #d4af37; padding: 15px; margin: 20px 0; border-radius: 4px;">
                                "${reply}"
                            </div>
                            <p>If you have any further questions, feel free to write to us or reach our delivery team at <strong>${DELIVERY_PHONE}</strong>.</p>
                            <p>Best Regards,<br><strong>Venthulir Team</strong></p>
                        </div>
                        <div style="background: #0b3d2e; padding: 16px; text-align: center; font-size: 12px; color: #a7f3d0;">
                            <img src="${LOGO_URL}" alt="Venthulir" style="height: 28px; display: block; margin: 0 auto 6px;">
                            <p style="margin: 0;">© ${new Date().getFullYear()} Venthulir Royal Reserves. All rights reserved.</p>
                            <p style="margin: 4px 0 0;">theventhulir@gmail.com | ${DELIVERY_PHONE}</p>
                        </div>
                    </div>
                `
            };
            transporter.sendMail(mailOptions).catch(console.error);
        }
        res.json(message);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};
