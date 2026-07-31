import React, { useState, useEffect } from 'react';
import { useAppNavigation } from '../context/NavigationContext';
import { ShieldCheck, Truck, ChevronRight, ArrowLeft, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import './CheckoutPage.css';

// Dynamically load the Razorpay checkout script (only once)
const loadRazorpayScript = () =>
    new Promise((resolve) => {
        if (document.getElementById('razorpay-script')) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

const CheckoutPage = ({ viewParams = {} }) => {
    const { appNavigate } = useAppNavigation();
    const { user, isAuthenticated, updateUser } = useAuth();
    const { cart, getTotalPrice, getTotalShipping, clearCart } = useCart();

    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [variant, setVariant] = useState(null);
    const isCartMode = !viewParams.productId && !viewParams.id;

    const [step, setStep] = useState(1);
    const [shippingData, setShippingData] = useState({
        fullName: user?.name || '',
        address: user?.deliveryAddress?.address || '',
        city: user?.deliveryAddress?.city || '',
        state: user?.deliveryAddress?.state || '',
        zipCode: user?.deliveryAddress?.zipCode || '',
        phone: user?.phone || ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState('');
    const [orderError, setOrderError] = useState('');
    const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [placedOrderId, setPlacedOrderId] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'razorpay'

    useEffect(() => {
        if (!isAuthenticated) {
            appNavigate('auth', { redirectView: 'checkout', redirectParams: viewParams });
            return;
        }
        if (isCartMode) {
            if (cart.length === 0) { appNavigate('home'); return; }
            fetchAvailableCoupons();
        } else {
            const productId = viewParams.productId || viewParams.id;
            const qty = parseInt(viewParams.quantity) || 1;
            const variantLabel = viewParams.variant;
            fetchProduct(productId, qty, variantLabel);
            fetchAvailableCoupons();
        }
    }, [isAuthenticated, viewParams]);

    const fetchAvailableCoupons = async () => {
        try {
            const res = await api.get('/coupons/public');
            if (Array.isArray(res)) setAvailableCoupons(res);
        } catch (err) { console.error('Failed to load coupons', err); }
    };

    const fetchProduct = async (id, qty, variantLabel) => {
        try {
            let found;
            try { found = await api.get(`/products/${id}`); } catch (e) { }
            if (!found || found.message) {
                const data = await api.get('/products');
                const list = Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : []);
                found = list.find(p => String(p._id) === String(id) || String(p.id) === String(id));
            }
            if (!found || found.message) {
                try {
                    const offerData = await api.get('/offers/active');
                    const offersList = Array.isArray(offerData) ? offerData : [];
                    found = offersList.find(o => String(o._id) === String(id) || String(o.id) === String(id));
                    if (found) {
                        found.price = found.offerPrice;
                        found.isOffer = true;
                    }
                } catch (e) {}
            }
            if (found) {
                setProduct(found);
                setQuantity(qty);
                if (variantLabel && found.variants) {
                    const v = found.variants.find(v => v.label === variantLabel);
                    setVariant(v || found.variants[0]);
                } else if (found.variants?.length > 0) {
                    setVariant(found.variants[0]);
                }
            }
        } catch (err) { console.error(err); }
    };

    const handleShippingSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put('/auth/address', {
                address: shippingData.address, city: shippingData.city,
                state: shippingData.state, zipCode: shippingData.zipCode
            });
            if (res.deliveryAddress) updateUser({ ...user, deliveryAddress: res.deliveryAddress });
        } catch (err) { console.error('Address save failed quietly', err); }
        setStep(2);
    };

    const getOrderItems = () => {
        if (isCartMode) {
            return cart.map(item => ({
                product: item._id || item.id,
                name: item.name,
                variant: item.selectedVariant || null,
                quantity: item.quantity,
                price: item.price
            }));
        }
        return [{ product: product._id || product.id, name: product.name, variant: variant?.label, quantity, price: variant ? variant.price : product.price }];
    };

    const subtotal = isCartMode ? getTotalPrice() : (variant ? variant.price : product?.price || 0) * quantity;
    const shipping = isCartMode ? getTotalShipping() : (product?.shippingCharge || 0);
    const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercentage) / 100) : 0;
    const total = subtotal - discountAmount + shipping;

    // ── COD FLOW (unchanged) ─────────────────────────────────────────────────
    const handlePlaceCODOrder = async () => {
        setIsProcessing(true);
        setOrderError('');
        try {
            const orderData = {
                customerName: shippingData.fullName,
                customerEmail: user.email,
                phone: shippingData.phone,
                deliveryAddress: {
                    address: shippingData.address, city: shippingData.city,
                    state: shippingData.state, zipCode: shippingData.zipCode
                },
                items: getOrderItems(),
                originalAmount: subtotal,
                shippingCharge: shipping,
                discountAmount,
                couponUsed: appliedCoupon?.code || null,
                totalAmount: total,
                couponCode: appliedCoupon?.code || null
            };
            const res = await api.post('/coupons/checkout', orderData);
            setPlacedOrderId(res.order?._id || null);
            if (isCartMode) clearCart();
            setStep(3);
        } catch (err) {
            const backendMsg = err?.response?.data?.error || err?.message || '';
            setOrderError(backendMsg || 'Order failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── RAZORPAY FLOW ────────────────────────────────────────────────────────
    const handleRazorpayPayment = async () => {
        setIsProcessing(true);
        setOrderError('');

        try {
            // 1. Load Razorpay script
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setOrderError('Failed to load payment gateway. Please check your connection.');
                setIsProcessing(false);
                return;
            }

            // 2. Create Razorpay order on backend
            const rzpOrderData = await api.post('/payment/create-order', { amount: total });

            // 3. Configure and open the Razorpay modal
            const options = {
                key: rzpOrderData.key,
                amount: rzpOrderData.amount,
                currency: rzpOrderData.currency,
                name: 'Venthulir Royal Reserves',
                description: 'Secure Payment',
                image: 'https://i.ibb.co/rGZwVGYP/organic.png',
                order_id: rzpOrderData.id,
                prefill: {
                    name: shippingData.fullName,
                    email: user.email,
                    contact: shippingData.phone,
                },
                notes: {
                    address: `${shippingData.address}, ${shippingData.city}`,
                },
                theme: {
                    color: '#0b3d2e',
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessing(false);
                        setOrderError('Payment cancelled. You can try again.');
                    },
                },
                handler: async (response) => {
                    // 4. Payment successful in modal — verify server-side
                    try {
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            // Order details
                            customerName: shippingData.fullName,
                            customerEmail: user.email,
                            phone: shippingData.phone,
                            deliveryAddress: {
                                address: shippingData.address, city: shippingData.city,
                                state: shippingData.state, zipCode: shippingData.zipCode
                            },
                            items: getOrderItems(),
                            originalAmount: subtotal,
                            shippingCharge: shipping,
                            discountAmount,
                            couponUsed: appliedCoupon?.code || null,
                            totalAmount: total,
                            couponCode: appliedCoupon?.code || null,
                        };

                        const res = await api.post('/payment/verify', verifyPayload);
                        setPlacedOrderId(res.order?._id || null);
                        if (isCartMode) clearCart();
                        setStep(3);
                    } catch (verifyErr) {
                        const msg = verifyErr?.message || 'Payment verification failed. Contact support.';
                        setOrderError(msg);
                    } finally {
                        setIsProcessing(false);
                    }
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                setOrderError(`Payment failed: ${response.error.description || 'Unknown error'}. Please try again.`);
                setIsProcessing(false);
            });
            rzp.open();

        } catch (err) {
            const msg = err?.message || 'Could not initiate payment. Please try again.';
            setOrderError(msg);
            setIsProcessing(false);
        }
    };

    // ── DISPATCH based on selected payment method ─────────────────────────────
    const handlePlaceOrder = () => {
        if (paymentMethod === 'razorpay') {
            handleRazorpayPayment();
        } else {
            handlePlaceCODOrder();
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setIsVerifyingCoupon(true);
        setCouponError('');
        try {
            const productId = isCartMode ? null : (product?._id || product?.id);
            const res = await api.post('/coupons/validate', { code: couponInput, productId, customerEmail: user?.email });
            if (res.valid) {
                setAppliedCoupon({ code: res.couponCode, discountPercentage: res.discountPercentage });
                setCouponInput('');
            }
        } catch (err) {
            setCouponError(err.message || 'Invalid coupon');
            setAppliedCoupon(null);
        } finally { setIsVerifyingCoupon(false); }
    };

    const handleRemoveCoupon = () => { setAppliedCoupon(null); setCouponError(''); };

    if (!isCartMode && !product) return <div className="checkout-loading">Preparing your harvest...</div>;
    if (isCartMode && cart.length === 0 && step !== 3) return <div className="checkout-loading">Your cart is empty...</div>;

    // ── SUCCESS SCREEN ───────────────────────────────────────────────────────
    if (step === 3) {
        return (
            <div className="order-success-container">
                <div className="success-content">
                    <div className="success-icon-wrap">
                        <ShieldCheck size={64} color="#0b3d2e" />
                    </div>
                    <h1>Order Placed Successfully!</h1>
                    <p>Thank you, {user?.name}. Your royal harvest is being prepared with care.</p>
                    <div className="order-summary-box">
                        {placedOrderId && <p style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#0b3d2e' }}>Order ID: #{placedOrderId}</p>}
                        <p>📧 A confirmation email has been sent to <strong>{user?.email}</strong></p>
                        <p>🚚 Estimated Delivery: 3–5 Business Days</p>
                        <p>💰 Payment: {paymentMethod === 'razorpay' ? 'Paid Online (Razorpay)' : 'Cash on Delivery'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                        <button className="primary-checkout-btn" onClick={() => appNavigate('profile')}>View My Orders</button>
                        <button className="primary-checkout-btn" style={{ background: '#f8fafc', color: '#0b3d2e', border: '2px solid #0b3d2e' }} onClick={() => appNavigate('home')}>Continue Shopping</button>
                    </div>
                </div>
            </div>
        );
    }

    const summaryItems = isCartMode ? cart : (product ? [{ ...product, price: variant ? variant.price : product.price, selectedVariant: variant?.label, quantity }] : []);

    return (
        <div className="checkout-page-root">
            <header className="checkout-header">
                <div className="checkout-header-inner">
                    <button className="back-link" onClick={() => appNavigate(isCartMode ? 'cart' : 'home')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="checkout-logo" onClick={() => appNavigate('home')}>VENTHULIR</div>
                </div>
            </header>

            <main className="checkout-main">
                <div className="checkout-grid">
                    <div className="checkout-form-container">
                        <div className="checkout-stepper">
                            <div className={`step-item ${step >= 1 ? 'active' : ''}`}>Shipping</div>
                            <div className="step-divider"></div>
                            <div className={`step-item ${step >= 2 ? 'active' : ''}`}>Payment</div>
                        </div>

                        {step === 1 ? (
                            <div className="shipping-section animate-fade-in">
                                <h2>Shipping Information</h2>
                                <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>Your address will be saved for future orders.</p>
                                <form className="checkout-form" onSubmit={handleShippingSubmit}>
                                    <div className="input-group"><label>Full Name</label><input required type="text" value={shippingData.fullName} onChange={e => setShippingData({ ...shippingData, fullName: e.target.value })} /></div>
                                    <div className="input-group"><label>Street Address</label><input required type="text" value={shippingData.address} onChange={e => setShippingData({ ...shippingData, address: e.target.value })} /></div>
                                    <div className="input-row">
                                        <div className="input-group"><label>City</label><input required type="text" value={shippingData.city} onChange={e => setShippingData({ ...shippingData, city: e.target.value })} /></div>
                                        <div className="input-group"><label>State</label><input required type="text" value={shippingData.state} onChange={e => setShippingData({ ...shippingData, state: e.target.value })} /></div>
                                    </div>
                                    <div className="input-row">
                                        <div className="input-group"><label>ZIP Code</label><input required type="text" value={shippingData.zipCode} onChange={e => setShippingData({ ...shippingData, zipCode: e.target.value })} /></div>
                                        <div className="input-group"><label>Phone Number</label><input required type="tel" value={shippingData.phone} onChange={e => setShippingData({ ...shippingData, phone: e.target.value })} /></div>
                                    </div>
                                    <button type="submit" className="primary-checkout-btn">Continue to Payment <ChevronRight size={18} /></button>
                                </form>
                            </div>
                        ) : (
                            <div className="payment-section animate-fade-in">
                                <h2>Payment Method</h2>
                                <div className="payment-options">
                                    {/* COD Option */}
                                    <div
                                        className={`payment-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                                        onClick={() => setPaymentMethod('cod')}
                                    >
                                        <div className="payment-radio">
                                            <div className={`radio-dot ${paymentMethod === 'cod' ? 'active' : ''}`} />
                                        </div>
                                        <Truck size={24} />
                                        <div className="payment-card-info">
                                            <span className="payment-card-title">Cash on Delivery</span>
                                            <span className="payment-card-desc">Pay with cash upon delivery. No advance required.</span>
                                        </div>
                                    </div>

                                    {/* Razorpay Option */}
                                    <div
                                        className={`payment-card ${paymentMethod === 'razorpay' ? 'selected razorpay-selected' : ''}`}
                                        onClick={() => setPaymentMethod('razorpay')}
                                    >
                                        <div className="payment-radio">
                                            <div className={`radio-dot ${paymentMethod === 'razorpay' ? 'active' : ''}`} />
                                        </div>
                                        <CreditCard size={24} />
                                        <div className="payment-card-info">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <span className="payment-card-title">Pay Online</span>
                                                <span className="razorpay-badge">Razorpay</span>
                                            </div>
                                            <span className="payment-card-desc">UPI · Cards · NetBanking · Wallets — 100% Secure</span>
                                        </div>
                                    </div>
                                </div>

                                {orderError && (
                                    <div className="animate-fade-in" style={{ color: '#B12704', background: '#fcf4f4', padding: '16px 20px', borderRadius: '12px', border: '1px solid #f5c6c6', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '18px' }}>⚠️</span> {orderError}
                                    </div>
                                )}

                                <div className="order-actions">
                                    <button className="secondary-checkout-btn" onClick={() => setStep(1)}>Back to Shipping</button>
                                    <button
                                        className={`primary-checkout-btn ${paymentMethod === 'razorpay' ? 'razorpay-btn' : ''}`}
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing}
                                        style={{ marginTop: 0 }}
                                    >
                                        {isProcessing
                                            ? (paymentMethod === 'razorpay' ? 'Opening Payment...' : 'Placing Order...')
                                            : paymentMethod === 'razorpay'
                                                ? `Pay ₹${total.toLocaleString()} Now`
                                                : `Confirm Order — ₹${total.toLocaleString()}`
                                        }
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="checkout-summary-container">
                        <div className="summary-card">
                            <h3>Order Summary ({summaryItems.length} item{summaryItems.length !== 1 ? 's' : ''})</h3>
                            {summaryItems.map((item, i) => (
                                <div key={i} className="summary-item product-preview" style={{ marginBottom: '12px' }}>
                                    <img src={item.imageUrl || item.images?.[0]} alt={item.name} />
                                    <div className="item-details">
                                        <h4>{item.name}</h4>
                                        <p>{item.selectedVariant || variant?.label || 'Standard'}</p>
                                        <p>Qty: {item.quantity}</p>
                                    </div>
                                    <div className="item-price">₹{(item.price * item.quantity).toLocaleString()}</div>
                                </div>
                            ))}

                            <div className="summary-divider"></div>
                            <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                            {appliedCoupon && <div className="summary-row" style={{ color: '#22c55e' }}><span>Discount ({appliedCoupon.discountPercentage}%)</span><span>- ₹{discountAmount.toLocaleString()}</span></div>}
                            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                            <div className="summary-row total"><span>Total</span><span>₹{total.toLocaleString()}</span></div>

                            <div className="coupon-entry-section" style={{ marginTop: '20px', borderTop: '1px dashed #e2e8f0', paddingTop: '20px' }}>
                                {appliedCoupon ? (
                                    <div style={{ background: '#dcfce7', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ color: '#166534', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={16} /> {appliedCoupon.code} Applied</div>
                                        <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Remove</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <select value={couponInput} onChange={e => setCouponInput(e.target.value)} style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff', fontSize: '14px' }}>
                                                <option value="">{availableCoupons.length > 0 ? '-- Select a Coupon --' : 'No Coupons Available'}</option>
                                                {availableCoupons.map(c => <option key={c._id} value={c.couponCode}>{c.couponCode} ({c.discountPercentage}% OFF)</option>)}
                                            </select>
                                            <button onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponInput.trim()} style={{ padding: '10px 20px', background: '#0b3d2e', color: '#d4af37', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                                {isVerifyingCoupon ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>{couponError}</span>}
                                    </div>
                                )}
                            </div>

                            <div className="guarantee-box"><ShieldCheck size={18} /><span>100% Satisfaction Guaranteed</span></div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutPage;
