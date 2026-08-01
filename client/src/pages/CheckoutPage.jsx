import React, { useState, useEffect } from 'react';
import { useAppNavigation } from '../context/NavigationContext';
import { 
    ShieldCheck, Truck, ArrowLeft, CreditCard, Wallet,
    ChevronDown, ChevronUp, MapPin, Tag, CheckCircle2, Package, Search, Star
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import './CheckoutPage.css';

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

    const [isAddressEdit, setIsAddressEdit] = useState(false);
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
    const [isSuccess, setIsSuccess] = useState(false);
    
    // Unified Payment Selection
    const [paymentMethod, setPaymentMethod] = useState('cod'); 
    
    // UI States
    const [summaryExpanded, setSummaryExpanded] = useState(true);
    const [recommendedProducts, setRecommendedProducts] = useState([]);

    useEffect(() => {
        if (!isAuthenticated) {
            appNavigate('auth', { redirectView: 'checkout', redirectParams: viewParams });
            return;
        }
        if (isCartMode) {
            if (cart.length === 0) { appNavigate('home'); return; }
        } else {
            const productId = viewParams.productId || viewParams.id;
            const qty = parseInt(viewParams.quantity) || 1;
            const variantLabel = viewParams.variant;
            fetchProduct(productId, qty, variantLabel);
        }
        fetchAvailableCoupons();
        fetchRecommended();
        
        // Ensure address edit mode if no address saved
        if (!user?.deliveryAddress?.address) {
            setIsAddressEdit(true);
        }
    }, [isAuthenticated, viewParams]);

    const fetchAvailableCoupons = async () => {
        try {
            const res = await api.get('/coupons/public');
            if (Array.isArray(res)) setAvailableCoupons(res);
        } catch (err) {}
    };

    const fetchRecommended = async () => {
        try {
            const res = await api.get('/products');
            if (res && Array.isArray(res.products)) {
                setRecommendedProducts(res.products.slice(0, 5));
            }
        } catch(e){}
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
        } catch (err) {}
    };

    const handleSaveAddress = async () => {
        try {
            const res = await api.put('/auth/address', {
                address: shippingData.address, city: shippingData.city,
                state: shippingData.state, zipCode: shippingData.zipCode
            });
            if (res.deliveryAddress) updateUser({ ...user, deliveryAddress: res.deliveryAddress });
            setIsAddressEdit(false);
        } catch (err) { console.error('Address save failed', err); setIsAddressEdit(false); }
    };

    const getOrderItems = () => {
        if (isCartMode) {
            return cart.map(item => ({
                product: item._id || item.id,
                name: item.name,
                variant: item.selectedVariant || null,
                quantity: item.quantity,
                price: item.price,
                hsnSac: item.hsnSac || ''
            }));
        }
        return [{ product: product._id || product.id, name: product.name, variant: variant?.label, quantity, price: variant ? variant.price : product.price, hsnSac: product.hsnSac || '' }];
    };

    const subtotal = isCartMode ? getTotalPrice() : (variant ? variant.price : product?.price || 0) * quantity;
    const shipping = isCartMode ? getTotalShipping() : (product?.shippingCharge || 0);
    const discountAmount = appliedCoupon ? Math.round((subtotal * appliedCoupon.discountPercentage) / 100) : 0;
    const total = subtotal - discountAmount + shipping;

    // ── COD FLOW ──
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
            setIsSuccess(true);
        } catch (err) {
            setOrderError(err?.response?.data?.error || err?.message || 'Order failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    // ── RAZORPAY FLOW ──
    const handleRazorpayPayment = async () => {
        setIsProcessing(true);
        setOrderError('');
        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                setOrderError('Failed to load payment gateway. Please check your connection or disable your Adblocker/Brave Shields.');
                setIsProcessing(false);
                return;
            }
            const rzpOrderData = await api.post('/payment/create-order', { amount: total });
            const options = {
                key: rzpOrderData.key,
                amount: rzpOrderData.amount,
                currency: rzpOrderData.currency,
                name: 'Venthulir Organic',
                description: 'Secure Payment',
                image: 'https://i.ibb.co/rGZwVGYP/organic.png',
                order_id: rzpOrderData.id,
                prefill: { name: shippingData.fullName, email: user.email, contact: shippingData.phone },
                notes: { address: `${shippingData.address}, ${shippingData.city}` },
                theme: { color: '#0A2E1F' },
                modal: { ondismiss: () => { setIsProcessing(false); setOrderError('Payment cancelled.'); } },
                handler: async (response) => {
                    try {
                        const verifyPayload = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
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
                        setIsSuccess(true);
                    } catch (verifyErr) {
                        setOrderError(verifyErr?.message || 'Payment verification failed.');
                    } finally { setIsProcessing(false); }
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response) => {
                setOrderError(`Payment failed: ${response.error.description}.`);
                setIsProcessing(false);
            });
            rzp.open();
        } catch (err) {
            setOrderError(err?.message || 'Could not initiate payment.');
            setIsProcessing(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (isAddressEdit) {
            if (!shippingData.fullName || !shippingData.address || !shippingData.city || !shippingData.phone) {
                alert("Please fill in all delivery address details.");
                return;
            }
            setIsProcessing(true);
            try {
                const res = await api.put('/auth/address', {
                    address: shippingData.address, city: shippingData.city,
                    state: shippingData.state, zipCode: shippingData.zipCode
                });
                if (res.deliveryAddress) updateUser({ ...user, deliveryAddress: res.deliveryAddress });
                setIsAddressEdit(false);
            } catch (err) { 
                console.error('Address save failed', err); 
            } finally {
                setIsProcessing(false);
            }
        }

        // Re-check shipping data after potential save
        if (!shippingData.address || !shippingData.city || !shippingData.phone) {
            alert("Please save a valid delivery address first.");
            return;
        }
        if (paymentMethod === 'cod') handlePlaceCODOrder();
        else handleRazorpayPayment();
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

    if (!isCartMode && !product) return <div className="checkout-luxury-root" style={{padding: '50px', textAlign: 'center'}}>Preparing your harvest...</div>;
    if (isCartMode && cart.length === 0 && !isSuccess) return <div className="checkout-luxury-root" style={{padding: '50px', textAlign: 'center'}}>Your cart is empty...</div>;

    const summaryItems = isCartMode ? cart : (product ? [{ ...product, price: variant ? variant.price : product.price, selectedVariant: variant?.label, quantity }] : []);

    // ── SUCCESS SCREEN ──
    if (isSuccess) {
        return (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="co-success-view">
                <div className="co-success-icon"><ShieldCheck size={40} /></div>
                <h1>Order Confirmed</h1>
                <p style={{color: '#6B7280', marginBottom: '24px'}}>Thank you, {user?.name}. Your order has been securely placed.</p>
                {placedOrderId && <p style={{fontFamily:'monospace', fontWeight: 700, color: '#0A2E1F', background: '#f1f5f9', padding: '10px 20px', borderRadius: '10px', marginBottom: '32px'}}>Order ID: #{placedOrderId.slice(-8).toUpperCase()}</p>}
                <div style={{display:'flex', gap: '16px'}}>
                    <button className="co-btn-secondary" onClick={() => appNavigate('profile', {section: 'orders'})}>View Orders</button>
                    <button className="co-btn-primary" onClick={() => appNavigate('home')}>Continue Shopping</button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="checkout-luxury-root">
            {/* Header */}
            <header className="co-header">
                <div className="co-announcement">
                    🌿 100% Organic Products • 🚚 Free Shipping Above ₹899
                </div>
                <div className="co-header-inner">
                    <button className="co-back-btn" onClick={() => appNavigate(isCartMode ? 'cart' : 'home')}>
                        <ArrowLeft size={18} /> Back
                    </button>
                    <div className="co-logo" onClick={() => appNavigate('home')}>VENTHULIR</div>
                    <div className="co-secure-badge"><ShieldCheck size={16} /> 100% Secure</div>
                </div>
            </header>

            <main className="co-main">
                {/* 1. Address Section */}
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="co-card">
                    <div className="co-card-header">
                        <h2 className="co-card-title"><MapPin size={24} /> Delivery Address</h2>
                        {!isAddressEdit && (
                            <button className="co-btn-secondary" onClick={() => setIsAddressEdit(true)}>Edit Address</button>
                        )}
                    </div>
                    
                    <AnimatePresence mode="wait">
                        {isAddressEdit ? (
                            <motion.div key="edit" initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}}>
                                <div className="co-form-grid">
                                    <div className="co-input-group"><label>Full Name</label><input className="co-input" type="text" value={shippingData.fullName} onChange={e => setShippingData({...shippingData, fullName: e.target.value})} /></div>
                                    <div className="co-input-group"><label>Phone Number</label><input className="co-input" type="tel" value={shippingData.phone} onChange={e => setShippingData({...shippingData, phone: e.target.value})} /></div>
                                </div>
                                <div className="co-input-group" style={{marginTop:'16px'}}><label>Street Address</label><input className="co-input" type="text" value={shippingData.address} onChange={e => setShippingData({...shippingData, address: e.target.value})} /></div>
                                <div className="co-form-grid">
                                    <div className="co-input-group"><label>City</label><input className="co-input" type="text" value={shippingData.city} onChange={e => setShippingData({...shippingData, city: e.target.value})} /></div>
                                    <div className="co-input-group"><label>State</label><input className="co-input" type="text" value={shippingData.state} onChange={e => setShippingData({...shippingData, state: e.target.value})} /></div>
                                    <div className="co-input-group"><label>ZIP Code</label><input className="co-input" type="text" value={shippingData.zipCode} onChange={e => setShippingData({...shippingData, zipCode: e.target.value})} /></div>
                                </div>
                                <div style={{marginTop: '24px'}}>
                                    <button className="co-btn-primary" onClick={handleSaveAddress} style={{padding: '12px 24px', fontSize: '14px'}}>Save Address</button>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div key="view" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="co-address-box">
                                <h4>{shippingData.fullName}</h4>
                                <p>{shippingData.phone} • {user.email}</p>
                                <p>{shippingData.address}, {shippingData.city}, {shippingData.state} - {shippingData.zipCode}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* 2. Order Summary */}
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="co-card">
                    <button className="co-summary-toggle" onClick={() => setSummaryExpanded(!summaryExpanded)}>
                        <h2 className="co-card-title"><Package size={24} /> Order Summary ({summaryItems.length} items)</h2>
                        {summaryExpanded ? <ChevronUp size={24} color="#0A2E1F" /> : <ChevronDown size={24} color="#0A2E1F" />}
                    </button>
                    
                    <AnimatePresence>
                        {summaryExpanded && (
                            <motion.div initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} exit={{opacity:0, height:0}} style={{overflow: 'hidden'}}>
                                <div style={{marginTop: '24px'}}>
                                    {summaryItems.map((item, i) => (
                                        <div key={i} className="co-summary-item">
                                            <img src={item.image || item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1611078589410-63259972c72b?auto=format&fit=crop&q=80&w=100'} alt={item.name} className="co-summary-img"/>
                                            <div className="co-summary-details">
                                                <h5>{item.name}</h5>
                                                {item.selectedVariant && <p>{item.selectedVariant}</p>}
                                                <p>Qty: {item.quantity}</p>
                                            </div>
                                            <div className="co-summary-price">₹{(item.price * item.quantity).toLocaleString()}</div>
                                        </div>
                                    ))}
                                    
                                    <div style={{marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #E7E5DD'}}>
                                        <div className="co-breakdown-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
                                        {appliedCoupon && <div className="co-breakdown-row" style={{color:'#16A34A'}}><span>Discount ({appliedCoupon.discountPercentage}%)</span><span>- ₹{discountAmount.toLocaleString()}</span></div>}
                                        <div className="co-breakdown-row"><span>Shipping</span><span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
                                        <div className="co-breakdown-total"><span>Grand Total</span><span>₹{total.toLocaleString()}</span></div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* 3. Coupons */}
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="co-card">
                    <h2 className="co-card-title" style={{marginBottom:'16px'}}><Tag size={24} /> Apply Coupon</h2>
                    {appliedCoupon ? (
                        <div style={{background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <strong style={{color: '#16a34a', display:'flex', gap:'8px', alignItems:'center'}}><CheckCircle2 size={18}/> {appliedCoupon.code} Applied Successfully!</strong>
                            <button onClick={() => setAppliedCoupon(null)} style={{background: 'none', border:'none', color:'#dc2626', fontWeight: 700, cursor:'pointer'}}>Remove</button>
                        </div>
                    ) : (
                        <div>
                            <div className="co-coupon-flex">
                                <input type="text" className="co-coupon-input" placeholder="Enter coupon code" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} />
                                <button className="co-btn-secondary" onClick={handleApplyCoupon} disabled={!couponInput || isVerifyingCoupon} style={{background:'#0A2E1F', color:'#fff'}}>
                                    {isVerifyingCoupon ? 'Verifying...' : 'Apply'}
                                </button>
                            </div>
                            {couponError && <p style={{color: '#dc2626', fontSize: '13px', marginTop: '8px', fontWeight: 600}}>{couponError}</p>}
                            
                            {availableCoupons.length > 0 && (
                                <div style={{marginTop:'16px', display:'flex', gap:'10px', flexWrap:'wrap'}}>
                                    {availableCoupons.map(c => (
                                        <div key={c._id} onClick={() => setCouponInput(c.couponCode)} style={{cursor:'pointer', background:'#f8fafc', padding:'8px 12px', borderRadius:'8px', fontSize:'12px', fontWeight:700, border:'1px dashed #cbd5e1'}}>
                                            {c.couponCode} <span style={{color:'#16a34a'}}>(-{c.discountPercentage}%)</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* 4. Payment Method */}
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="co-card">
                    <h2 className="co-card-title"><CreditCard size={24} /> Payment Method</h2>
                    
                    <div className="co-payment-grid">
                        <div className={`co-payment-card ${paymentMethod === 'cod' ? 'active' : ''}`} onClick={() => setPaymentMethod('cod')}>
                            <div className="co-payment-icon"><Truck size={20} /></div>
                            <div>
                                <h5>Cash on Delivery</h5>
                                <p>Pay at doorstep</p>
                            </div>
                        </div>
                        
                        <div className={`co-payment-card ${paymentMethod === 'razorpay' ? 'active' : ''}`} onClick={() => setPaymentMethod('razorpay')}>
                            <div className="co-payment-icon"><Wallet size={20} /></div>
                            <div>
                                <h5>Pay Online Securely</h5>
                                <p>UPI, Cards, NetBanking</p>
                            </div>
                        </div>
                    </div>
                    
                    {orderError && (
                        <div style={{marginTop: '20px', padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', color: '#b91c1c', fontWeight: 600, fontSize: '14px', display:'flex', gap:'8px'}}>
                            <span>⚠️</span> {orderError}
                        </div>
                    )}
                </motion.div>

                {/* 5. Order Tracker Info */}
                <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.4}} className="co-tracker-grid">
                    <div className="co-tracker-card">
                        <Truck size={24} color="#0A2E1F" />
                        <span>Est. Delivery</span>
                        <p>3-5 Business Days</p>
                    </div>
                    <div className="co-tracker-card">
                        <ShieldCheck size={24} color="#0A2E1F" />
                        <span>100% Secure</span>
                        <p>Encrypted Payments</p>
                    </div>
                    <div className="co-tracker-card">
                        <CheckCircle2 size={24} color="#0A2E1F" />
                        <span>Authentic</span>
                        <p>Organic Certified</p>
                    </div>
                </motion.div>

                {/* 6. Recommended Products */}
                {recommendedProducts.length > 0 && (
                    <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.5}} style={{marginTop: '20px'}}>
                        <h2 className="co-card-title" style={{marginBottom: '20px'}}>Recommended For You</h2>
                        <div className="co-carousel">
                            {recommendedProducts.map(prod => (
                                <div key={prod._id} className="co-product-card" onClick={() => appNavigate('product', { id: prod.slug || prod._id || prod.id })}>
                                    <img src={prod.imageUrl || prod.images?.[0] || 'https://images.unsplash.com/photo-1611078589410-63259972c72b?auto=format&fit=crop&q=80&w=200'} className="co-product-img" alt={prod.name} />
                                    <h5>{prod.name}</h5>
                                    <div style={{display:'flex', gap:'4px', alignItems:'center', margin:'4px 0'}}>
                                        <Star size={12} fill="#eab308" color="#eab308"/>
                                        <span style={{fontSize:'12px', color:'#64748b'}}>4.9</span>
                                    </div>
                                    <p>₹{prod.price || prod.offerPrice || 0}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </main>

            {/* Sticky Bottom Bar */}
            <div className="co-bottom-bar">
                <div className="co-bottom-inner">
                    <div className="co-bottom-total">
                        <span>Grand Total</span>
                        <strong>₹{total.toLocaleString()}</strong>
                    </div>
                    <button className="co-btn-primary" onClick={handlePlaceOrder} disabled={isProcessing}>
                        {isProcessing ? 'Processing...' : (paymentMethod === 'razorpay' ? `Pay Securely` : `Place COD Order`)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
