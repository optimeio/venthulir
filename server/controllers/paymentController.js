const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const { reduceStock } = require('./inventoryController');
const transporter = require('../utils/email');

const LOGO_URL = 'https://i.ibb.co/rGZwVGYP/organic.png';
const DELIVERY_PHONE = process.env.DELIVERY_PHONE || '8778476414';
const OWNER_EMAIL = process.env.OWNER_EMAIL || process.env.EMAIL_USER;

// Lazy-initialize Razorpay instance so missing env vars don't crash at boot
let razorpay;
const getRazorpay = () => {
    if (!razorpay) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_SECRET,
        });
    }
    return razorpay;
};

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order and returns the order id, amount, currency, and key.
 * The frontend uses these to open the Razorpay checkout modal.
 */
exports.createRazorpayOrder = async (req, res) => {
    try {
        const { amount } = req.body; // amount in rupees from client
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const options = {
            amount: Math.round(Number(amount) * 100), // Razorpay needs paise
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
        };

        const order = await getRazorpay().orders.create(options);

        res.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            key: process.env.RAZORPAY_KEY_ID,
        });
    } catch (err) {
        console.error('❌ Razorpay create-order error:', err);
        res.status(500).json({ error: 'Failed to create payment order. Please try again.' });
    }
};

/**
 * POST /api/payment/verify
 * Verifies the Razorpay payment signature (HMAC-SHA256).
 * On success, saves the order in the DB and sends confirmation emails.
 */
exports.verifyAndPlaceOrder = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            // Order details from client
            customerName,
            customerEmail,
            phone,
            deliveryAddress,
            items,
            originalAmount,
            shippingCharge,
            discountAmount,
            totalAmount,
            couponCode,
            couponUsed,
        } = req.body;

        // 1. Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expectedSignature !== razorpay_signature) {
            console.warn('⚠️  Razorpay signature mismatch — possible tamper attempt');
            return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
        }

        // 2. Handle coupon usage if any
        if (couponCode) {
            const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });
            if (coupon) {
                // Re-validate before incrementing
                const alreadyUsed = await Order.findOne({ customerEmail, couponUsed: coupon.couponCode });
                if (alreadyUsed) {
                    return res.status(400).json({ error: 'You have already used this coupon code' });
                }
                if (coupon.status === 'Active' && new Date(coupon.expiryDate) >= new Date() && coupon.usedCount < coupon.maxUses) {
                    coupon.usedCount += 1;
                    await coupon.save();
                }
            }
        }

        // 3. Reduce stock atomically
        const stockResult = await reduceStock(items);
        if (!stockResult.success) {
            return res.status(400).json({ error: stockResult.error });
        }

        // 4. Save order to database
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
            totalAmount,
            paymentMethod: 'Razorpay',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            status: 'Processing',
        });

        await newOrder.save();
        console.log(`✅ Razorpay order placed: #${newOrder._id} | ₹${totalAmount} | ${customerEmail}`);

        // 5. Send confirmation emails (same template as COD)
        const itemsHtml = items.map(item => `
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
                    <p style="font-size: 15px; line-height: 1.5; color: #555;">Your royal harvest from Venthulir is being prepared. Payment received successfully via Razorpay.</p>

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
                            <tbody>${itemsHtml}</tbody>
                        </table>
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #f0ede0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>Subtotal:</span>
                                <strong>₹${originalAmount || totalAmount}</strong>
                            </div>
                            ${shippingCharge ? `
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
                                <span>Total Paid (Online):</span>
                                <span>₹${totalAmount}</span>
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
                        <p style="margin: 10px 0 0 0; font-weight: bold; color: #10b981;">💳 Payment Method: Paid Online (Razorpay)</p>
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

        const ownerHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #0b3d2e; border-radius: 12px; overflow: hidden; color: #333;">
                <div style="background: #0b3d2e; padding: 20px; text-align: center;">
                    <img src="${LOGO_URL}" alt="Venthulir" style="height: 50px; display: block; margin: 0 auto;">
                    <h2 style="color: #d4af37; margin: 10px 0 0;">🛒 NEW ORDER — ONLINE PAYMENT</h2>
                </div>
                <div style="padding: 25px;">
                    <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                        <tr><td style="padding: 8px; color: #64748b; width: 140px;">Order ID</td><td style="padding: 8px; font-family: monospace; font-weight: bold; color: #0b3d2e;">#${newOrder._id}</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Customer</td><td style="padding: 8px; font-weight: bold;">${customerName}</td></tr>
                        <tr><td style="padding: 8px; color: #64748b;">Email</td><td style="padding: 8px;">${customerEmail}</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Phone</td><td style="padding: 8px;">${phone}</td></tr>
                        <tr><td style="padding: 8px; color: #64748b;">Address</td><td style="padding: 8px;">${deliveryAddress.address}, ${deliveryAddress.city}, ${deliveryAddress.state} - ${deliveryAddress.zipCode}</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Total</td><td style="padding: 8px; font-size: 18px; font-weight: bold; color: #0b3d2e;">₹${totalAmount}</td></tr>
                        <tr><td style="padding: 8px; color: #64748b;">Payment</td><td style="padding: 8px; color: #10b981; font-weight: bold;">✅ PAID via Razorpay</td></tr>
                        <tr style="background: #f8fafc;"><td style="padding: 8px; color: #64748b;">Razorpay ID</td><td style="padding: 8px; font-family: monospace; font-size: 12px;">${razorpay_payment_id}</td></tr>
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
            await transporter.sendMail({
                from: `Venthulir Official <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                to: customerEmail,
                subject: `✅ Order Confirmed - #${newOrder._id} | Venthulir`,
                html: emailHtml,
            });

            await transporter.sendMail({
                from: `Venthulir Orders <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
                to: OWNER_EMAIL,
                subject: `🛒 NEW ORDER ₹${totalAmount} from ${customerName} [PAID] - #${newOrder._id}`,
                html: ownerHtml,
            });
        } catch (mailErr) {
            console.error('⚠️  Email send warning (order still placed):', mailErr.message);
        }

        res.status(201).json({ msg: 'Payment verified. Order placed successfully.', order: newOrder });

    } catch (err) {
        console.error('❌ Razorpay verify error:', err);
        res.status(500).json({ error: 'Server error during payment verification. Please contact support.' });
    }
};
