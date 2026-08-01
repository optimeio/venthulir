const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const Order = require('../models/Order');
const transporter = require('../utils/email');

const LOGO_URL = 'https://i.ibb.co/rGZwVGYP/organic.png';
const DELIVERY_PHONE = process.env.DELIVERY_PHONE || '8778476414';
const OWNER_EMAIL = process.env.OWNER_EMAIL || process.env.EMAIL_USER;

// Validate Coupon
exports.validateCoupon = async (req, res) => {
    try {
        const { code, productId, customerEmail } = req.body;
        if (!code) return res.status(400).json({ error: 'Coupon code required' });

        const coupon = await Coupon.findOne({ couponCode: code.toUpperCase() });

        if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
        if (coupon.status !== 'Active') return res.status(400).json({ error: 'Coupon is inactive' });
        if (new Date(coupon.expiryDate) < new Date()) return res.status(400).json({ error: 'Coupon has expired' });
        if (coupon.usedCount >= coupon.maxUses) return res.status(400).json({ error: 'Coupon limit reached' });

        if (customerEmail) {
            const hasUsed = await Order.findOne({ customerEmail, couponUsed: coupon.couponCode });
            if (hasUsed) return res.status(400).json({ error: 'You have already used this coupon code' });
        }

        // If coupon is tied to a specific product
        if (coupon.productId && String(coupon.productId) !== String(productId)) {
            return res.status(400).json({ error: 'Coupon is not valid for this product' });
        }

        res.json({
            valid: true,
            discountPercentage: coupon.discountPercentage,
            couponCode: coupon.couponCode
        });

    } catch (err) {
        res.status(500).json({ error: 'Server Error validating coupon' });
    }
};

// Checkout endpoint with coupon application
exports.applyCheckout = async (req, res) => {
    try {
        const { customerName, customerEmail, items, totalAmount, couponCode, phone, deliveryAddress, originalAmount, shippingCharge, discountAmount, couponUsed } = req.body;

        let finalAmount = totalAmount;

        if (couponCode) {
            const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });
            if (!coupon) return res.status(400).json({ error: 'Invalid coupon' });
            if (new Date(coupon.expiryDate) < new Date() || coupon.usedCount >= coupon.maxUses || coupon.status !== 'Active') {
                return res.status(400).json({ error: 'Coupon is no longer valid' });
            }

            if (customerEmail) {
                const hasUsed = await Order.findOne({ customerEmail, couponUsed: coupon.couponCode });
                if (hasUsed) return res.status(400).json({ error: 'You have already used this coupon code' });
            }

            // Increment usage
            coupon.usedCount += 1;
            await coupon.save();
        }

        // ── INVENTORY CHECK + ATOMIC REDUCTION ──────────────────────────────
        const { reduceStock } = require('./inventoryController');
        const stockResult = await reduceStock(items);
        if (!stockResult.success) {
            return res.status(400).json({ error: stockResult.error });
        }
        // ────────────────────────────────────────────────────────────────────

        // Enrich items with hsnSac from Product database
        const enrichedItems = await Promise.all(items.map(async (item) => {
            try {
                const prod = await Product.findById(item.product);
                return {
                    ...item,
                    hsnSac: prod ? (prod.hsnSac || "") : (item.hsnSac || "")
                };
            } catch (e) {
                return item;
            }
        }));

        const newOrder = new Order({
            customerName,
            customerEmail,
            phone,
            deliveryAddress,
            items: enrichedItems,
            originalAmount: originalAmount || totalAmount,
            shippingCharge: shippingCharge || 0,
            discountAmount: discountAmount || 0,
            couponUsed: (couponCode && typeof couponCode === 'string') ? couponCode.toUpperCase() : null,
            totalAmount: finalAmount,
            paymentMethod: 'Cash on Delivery',
            status: 'Processing'
        });

        await newOrder.save();

        // Build email HTML
        let itemsHtml = items.map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} ${item.variant ? `(${item.variant})` : ''}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price}</td>
            </tr>
        `).join('');

        const emailHtml = `
            <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; color: #333;">
                <div style="background: #0b3d2e; padding: 25px; text-align: center;">
                    <img src="${LOGO_URL}" alt="Venthulir Organic" style="height: 70px; display: block; margin: 0 auto;">
                </div>
                <div style="padding: 30px;">
                    <h2 style="color: #0b3d2e; margin-top: 0; font-size: 24px;">Order Confirmed ✅</h2>
                    <p style="font-size: 16px; line-height: 1.5;">Dear <strong>${customerName}</strong>,</p>
                    <p style="font-size: 15px; line-height: 1.5; color: #555;">Your royal harvest from Venthulir is being prepared. Thank you for trusting us with your order.</p>

                    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; font-size: 14px;">
                        <strong style="color: #166534;">Order ID:</strong>
                        <span style="font-family: monospace; font-size: 15px; color: #0b3d2e; margin-left: 8px;">#${newOrder._id}</span>
                    </div>

                    <div style="background: #fdfcf7; border: 1px solid #d4af37; border-radius: 8px; padding: 15px; margin: 0 0 20px;">
                        <h3 style="margin-top: 0; color: #854d0e; font-size: 16px; border-bottom: 1px solid #f0ede0; padding-bottom: 10px;">Order Summary</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                            <thead>
                                <tr style="background: #fef9ec;">
                                    <th style="padding: 8px 10px; text-align: left; color: #92400e;">Item</th>
                                    <th style="padding: 8px 10px; text-align: center; color: #92400e;">Qty</th>
                                    <th style="padding: 8px 10px; text-align: right; color: #92400e;">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0ede0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Subtotal:</span>
                                <strong>₹${originalAmount || finalAmount}</strong>
                            </div>
                            ${(shippingCharge) ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #555;">
                                <span>Shipping:</span>
                                <strong>+ ₹${shippingCharge}</strong>
                            </div>` : ''}
                            ${discountAmount > 0 ? `
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px; color: #166534;">
                                <span>Discount (${couponUsed}):</span>
                                <strong>- ₹${discountAmount}</strong>
                            </div>` : ''}
                            <div style="display: flex; justify-content: space-between; padding-top: 8px; margin-top: 8px; border-top: 1px dotted #ccc; font-weight: bold; color: #d4af37;">
                                <span>Total Paid (COD):</span>
                                <span>₹${finalAmount}</span>
                            </div>
                        </div>
                    </div>

                    <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 14px; color: #475569; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0; color: #1e293b;">📦 Delivery Details</h4>
                        <p style="margin: 0;">
                            <strong>${customerName}</strong><br/>
                            ${phone}<br/>
                            ${deliveryAddress.address},<br/>
                            ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.zipCode}
                        </p>
                        <p style="margin: 10px 0 0 0; font-weight: bold; color: #d4af37;">💰 Payment Method: Cash on Delivery</p>
                    </div>

                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 14px; color: #78350f;">
                        📞 For delivery queries, contact our team: <strong>${DELIVERY_PHONE}</strong>
                    </div>
                </div>
                <div style="background: #0b3d2e; padding: 20px; text-align: center; font-size: 12px; color: #a7f3d0;">
                    <img src="${LOGO_URL}" alt="Venthulir" style="height: 30px; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto;">
                    <p style="margin: 0;">© ${new Date().getFullYear()} Venthulir Royal Reserves. All rights reserved.</p>
                    <p style="margin: 4px 0 0 0;">theventhulir@gmail.com | ${DELIVERY_PHONE}</p>
                </div>
            </div>
        `;

        // Owner notification email (richer admin view)
        const ownerHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #0b3d2e; border-radius: 12px; overflow: hidden; color: #333;">
                <div style="background: #0b3d2e; padding: 20px; text-align: center;">
                    <img src="${LOGO_URL}" alt="Venthulir" style="height: 50px; display: block; margin: 0 auto;">
                    <h2 style="color: #d4af37; margin: 10px 0 0;">🛒 NEW ORDER RECEIVED</h2>
                </div>
                <div style="padding: 25px;">
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                        <tr><td style="padding: 8px; color: #64748b; width: 140px;">Order ID</td><td style="padding: 8px; font-family: monospace; font-weight: bold; color: #0b3d2e;">#${newOrder._id}</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Customer</td><td style="padding: 8px; font-weight: bold;">${customerName}</td></tr>
                        <tr><td style="padding: 8px; color: #64748b;">Email</td><td style="padding: 8px;">${customerEmail}</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Phone</td><td style="padding: 8px;">${phone}</td></tr>
                        <tr><td style="padding: 8px; color: #64748b;">Address</td><td style="padding: 8px;">${deliveryAddress.address}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.zipCode}</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Total</td><td style="padding: 8px; font-size: 18px; font-weight: bold; color: #0b3d2e;">₹${finalAmount}</td></tr>
                        <tr><td style="padding: 8px; color: #64748b;">Payment</td><td style="padding: 8px; color: #d97706; font-weight: bold;">Cash on Delivery</td></tr>
                    </table>
                    <div style="margin-top: 20px; background: #fdfcf7; border: 1px solid #d4af37; border-radius: 8px; padding: 15px;">
                        <strong style="color: #854d0e;">Items Ordered:</strong>
                        <table style="width: 100%; font-size: 13px; margin-top: 8px; border-collapse: collapse;">
                            <thead><tr style="background: #fef9ec;"><th style="padding: 6px 10px; text-align: left;">Item</th><th style="padding: 6px 10px; text-align: center;">Qty</th><th style="padding: 6px 10px; text-align: right;">Price</th></tr></thead>
                            <tbody>${itemsHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        try {
            // Customer confirmation
            await transporter.sendMail({
                from: `Venthulir Official <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                to: customerEmail,
                subject: `✅ Order Confirmed - #${newOrder._id} | Venthulir`,
                html: emailHtml
            });

            // Owner notification
            await transporter.sendMail({
                from: `Venthulir Orders <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                to: OWNER_EMAIL,
                subject: `🛒 NEW ORDER ₹${finalAmount} from ${customerName} - #${newOrder._id}`,
                html: ownerHtml
            });
        } catch (mailErr) {
            console.error('Email send warning:', mailErr.message);
        }

        res.status(201).json({ msg: 'Order placed successfully', order: newOrder });

    } catch (err) {
        res.status(500).json({ error: 'Server Error during checkout' });
    }
};

// Public Endpoints
exports.getPublicCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({
            status: 'Active',
            $or: [
                { maxUses: { $exists: false } },
                { $expr: { $gt: ["$maxUses", "$usedCount"] } }
            ]
        }).select('-__v'); // Send safe format
        res.json(coupons);
    } catch (err) {
        res.status(500).json({ error: 'Server Error fetching public coupons' });
    }
};

// Admin Endpoints
exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().populate('productId', 'name productCode').sort({ createdAt: -1 });

        res.json(coupons);
    } catch (err) {
        res.status(500).json({ error: 'Server Error fetching coupons' });
    }
};

exports.createCoupon = async (req, res) => {
    try {
        const { couponCode, productId, maxUses, expiryDate, status, discountPercentage } = req.body;
        const newCoupon = new Coupon({
            couponCode: couponCode.toUpperCase(),
            productId: productId || null,
            maxUses,
            expiryDate,
            status,
            discountPercentage
        });
        await newCoupon.save();
        res.status(201).json(newCoupon);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Coupon code already exists' });
        res.status(500).json({ error: 'Server Error creating coupon' });
    }
};

exports.updateCoupon = async (req, res) => {
    try {
        const { couponCode, productId, maxUses, expiryDate, status, discountPercentage } = req.body;
        const updatedCoupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            {
                couponCode: couponCode ? couponCode.toUpperCase() : undefined,
                productId: productId || null,
                maxUses,
                expiryDate,
                status,
                discountPercentage
            },
            { new: true, runValidators: true }
        );
        if (!updatedCoupon) return res.status(404).json({ error: 'Coupon not found' });
        res.json(updatedCoupon);
    } catch (err) {
        if (err.code === 11000) return res.status(400).json({ error: 'Coupon code already exists' });
        res.status(500).json({ error: 'Server Error updating coupon' });
    }
};

exports.deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Coupon removed' });
    } catch (err) {
        res.status(500).json({ error: 'Server Error deleting coupon' });
    }
};
