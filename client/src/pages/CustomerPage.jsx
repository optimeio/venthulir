import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import OrderTracking from '../components/OrderTracking';
import InvoiceModal from '../components/InvoiceModal';
import CartPage from './CartPage';
import WishlistPage from './WishlistPage';
import { ShoppingCart, Package, Heart, Gift, Bell, MapPin, User, Settings, LogOut, ArrowRight, ShieldCheck, Tag, Lock, LifeBuoy, XCircle, FileText } from 'lucide-react';
import { api } from '../services/api';
import './CustomerPage.css';

const CustomerPage = () => {
    const { section } = useParams();
    const location = useLocation();
    const segment = section || location.pathname.split('/')[2] || 'account';

    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [messageText, setMessageText] = useState('');
    const [subjectText, setSubjectText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [orders, setOrders] = useState([]);

    // Profile Settings (4 fields: Name, Email, Mobile Number, Address)
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.deliveryAddress?.address || ''
    });
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.deliveryAddress?.address || ''
            });
        }
    }, [user]);

    useEffect(() => {
        if (user?.email) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const data = await api.get('/orders/me');
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    const handleViewInvoice = (order) => {
        setSelectedOrder(order);
        setIsInvoiceOpen(true);
    };

    const handleCancelOrder = async (id) => {
        if (!window.confirm('Are you sure you want to cancel this order?')) return;
        try {
            await api.put(`/orders/${id}/cancel`);
            alert('Order cancelled successfully.');
            fetchOrders();
        } catch (err) {
            console.error('Cancel order error:', err);
            alert(err?.response?.data?.error || err?.message || 'Failed to cancel order.');
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!messageText.trim()) return;
        setIsSending(true);
        try {
            await api.post('/messages', {
                customerName: user?.name || 'Guest',
                customerEmail: user?.email || '',
                message: subjectText ? `[Subject: ${subjectText}] ${messageText}` : messageText
            });
            alert('Your query has been submitted successfully.');
            setMessageText('');
            setSubjectText('');
        } catch (err) {
            alert(err.message || 'Error submitting query.');
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            // Update profile
            const profileRes = await api.put('/auth/profile', {
                name: profileData.name,
                phone: profileData.phone
            });
            let updatedUser = profileRes.user || { ...user, name: profileData.name, phone: profileData.phone };

            // Update address
            if (profileData.address) {
                const addressRes = await api.put('/auth/address', {
                    address: profileData.address,
                    city: user?.deliveryAddress?.city || '',
                    state: user?.deliveryAddress?.state || '',
                    zipCode: user?.deliveryAddress?.zipCode || ''
                });
                updatedUser = {
                    ...updatedUser,
                    deliveryAddress: addressRes.deliveryAddress || addressRes
                };
            }

            updateUser(updatedUser);
            alert('Profile settings saved successfully.');
        } catch (err) {
            alert(err.message || 'Failed to save profile settings.');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const userInitial = user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

    const pageContent = () => {
        switch(segment) {
            case 'orders':
                return (
                    <div className="cp-card-box">
                        <div className="cp-card-box-header">
                            <h2>My Orders</h2>
                            <p>Track your active shipments and view past order history.</p>
                        </div>
                        {orders.length === 0 ? (
                            <div className="cp-empty-state-box">
                                <Package size={48} className="cp-muted-icon" />
                                <h3>No orders placed yet</h3>
                                <p>Explore our organic products and place your first order.</p>
                                <button className="cp-submit-teal-btn" onClick={() => navigate('/products')}>
                                    Start Shopping
                                </button>
                            </div>
                        ) : (
                            <div className="cp-order-list-premium">
                                {orders.map((order) => {
                                    const orderId = String(order._id || order.id).slice(-8).toUpperCase();
                                    const orderDate = new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                                    
                                    return (
                                        <div key={order._id || order.id} className="cp-premium-order-card animate-fade-in">
                                            {/* Header */}
                                            <div className="cp-premium-order-header">
                                                <div className="cp-premium-header-left">
                                                    <div className="cp-premium-meta-group">
                                                        <span className="cp-premium-meta-label">Order ID</span>
                                                        <span className="cp-premium-meta-val" style={{ color: '#0A2E1F' }}>#{orderId}</span>
                                                    </div>
                                                    <div className="cp-premium-meta-group">
                                                        <span className="cp-premium-meta-label">Placed On</span>
                                                        <span className="cp-premium-meta-val">{orderDate}</span>
                                                    </div>
                                                    <div className="cp-premium-meta-group">
                                                        <span className="cp-premium-meta-label">Total Amount</span>
                                                        <span className="cp-premium-meta-val">₹{order.totalAmount || order.total}</span>
                                                    </div>
                                                </div>
                                                <div className="cp-premium-header-right">
                                                    <span className={`cp-premium-status-badge cp-status-${(order.status || 'Processing').toLowerCase()}`}>
                                                        {order.status || 'Processing'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Order Items */}
                                            <div className="cp-premium-order-items">
                                                {(order.items && order.items.length > 0 ? order.items : [{ name: 'Venthulir Organic Harvest', quantity: 1, price: order.totalAmount || order.total, variant: 'Standard' }]).map((item, idx) => (
                                                    <div key={idx} className="cp-premium-item-row">
                                                        <div className="cp-premium-item-image">
                                                            <img 
                                                                src={item.image || item.imageUrl || item.images?.[0] || 'https://images.unsplash.com/photo-1611078589410-63259972c72b?auto=format&fit=crop&q=80&w=200'} 
                                                                alt={item.name} 
                                                            />
                                                        </div>
                                                        <div className="cp-premium-item-details">
                                                            <h4>{item.name}</h4>
                                                            {item.variant && <p className="cp-premium-item-variant">Variant: {item.variant}</p>}
                                                            <p className="cp-premium-item-qty">Quantity: {item.quantity}</p>
                                                        </div>
                                                        <div className="cp-premium-item-price">
                                                            ₹{item.price * (item.quantity || 1)}
                                                        </div>
                                                        <div className="cp-premium-item-actions">
                                                            <button 
                                                                type="button" 
                                                                className="cp-premium-btn-secondary" 
                                                                onClick={() => item.product ? navigate(`/products/${item.product}`) : navigate('/products')}
                                                            >
                                                                Buy Again
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Tracking Progress */}
                                            <div className="cp-premium-tracking-wrapper">
                                                <OrderTracking status={order.status} order={order} />
                                            </div>

                                            {/* Footer Actions */}
                                            <div className="cp-premium-order-footer">
                                                <div className="cp-premium-footer-actions">
                                                    {(order.status === 'Pending' || order.status === 'Processing') && (
                                                        <button 
                                                            type="button" 
                                                            className="cp-premium-btn-danger" 
                                                            onClick={() => handleCancelOrder(order._id || order.id)}
                                                        >
                                                            <XCircle size={16} /> Cancel Order
                                                        </button>
                                                    )}
                                                    <button 
                                                        type="button" 
                                                        className="cp-premium-btn-outline" 
                                                        onClick={() => handleViewInvoice(order)}
                                                    >
                                                        <FileText size={16} /> View Invoice
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="cp-premium-btn-primary"
                                                        onClick={() => alert(`Tracking details for Order #${orderId} will be sent to your email.`)}
                                                    >
                                                        <MapPin size={16} /> Track Order
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );

            case 'wishlist':
                return <WishlistPage />;

            case 'cart':
                return <CartPage />;

            case 'support':
                return (
                    <div className="cp-card-box">
                        <div className="cp-card-box-header">
                            <h2>Help & Queries</h2>
                            <p>Submit your query and our team will get back to you promptly.</p>
                        </div>
                        <form onSubmit={handleSendMessage} className="cp-form-container">
                            <div className="cp-field-group">
                                <label>Subject</label>
                                <input
                                    type="text"
                                    className="cp-input-text"
                                    placeholder="Enter topic or order number"
                                    value={subjectText}
                                    onChange={(e) => setSubjectText(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="cp-field-group">
                                <label>Describe your issue</label>
                                <textarea
                                    className="cp-input-textarea"
                                    rows="5"
                                    placeholder="Provide details about your query..."
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <button type="submit" className="cp-submit-teal-btn" disabled={isSending || !messageText.trim()}>
                                {isSending ? 'Submitting Query...' : 'Submit Query'}
                            </button>
                        </form>
                    </div>
                );

            case 'rewards':
                return (
                    <div className="cp-card-box">
                        <div className="cp-card-box-header">
                            <h2>Coupons & Rewards</h2>
                            <p>Available promotional codes for Venthulir Organic products.</p>
                        </div>
                        <div className="cp-coupon-banner">
                            <Tag size={24} className="cp-gold-icon" />
                            <div className="cp-coupon-info">
                                <span className="cp-code-tag">VENTHULIR10</span>
                                <p>Get 10% OFF on all organic oil and herbal orders above ₹499.</p>
                            </div>
                            <button 
                                className="cp-submit-teal-btn" 
                                onClick={() => navigator.clipboard.writeText('VENTHULIR10').then(() => alert('Coupon code copied!'))}
                            >
                                COPY CODE
                            </button>
                        </div>
                    </div>
                );

            case 'profile':
                // Profile Settings page with 4 fields: Name, Email, Mobile Number, Address
                return (
                    <div className="cp-card-box">
                        <div className="cp-card-box-header">
                            <h2>Profile Settings</h2>
                            <p>Manage your account personal details and delivery information.</p>
                        </div>
                        <form onSubmit={handleSaveProfile} className="cp-form-container">
                            {/* 1. Name */}
                            <div className="cp-field-group">
                                <label>Name</label>
                                <input
                                    type="text"
                                    className="cp-input-text"
                                    placeholder="Your Name"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    required
                                />
                            </div>

                            {/* 2. Email (Read-only) */}
                            <div className="cp-field-group">
                                <label>Email (Read-only)</label>
                                <input
                                    type="email"
                                    className="cp-input-text cp-disabled-input"
                                    value={profileData.email}
                                    readOnly
                                    disabled
                                />
                            </div>

                            {/* 3. Mobile Number */}
                            <div className="cp-field-group">
                                <label>Mobile Number</label>
                                <input
                                    type="text"
                                    className="cp-input-text"
                                    placeholder="Your Mobile Number"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                />
                            </div>

                            {/* 4. Address */}
                            <div className="cp-field-group">
                                <label>Address</label>
                                <input
                                    type="text"
                                    className="cp-input-text"
                                    placeholder="Street, Area, City, Zip"
                                    value={profileData.address}
                                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                />
                            </div>

                            <button type="submit" className="cp-submit-teal-btn" disabled={isUpdatingProfile}>
                                {isUpdatingProfile ? 'Saving Settings...' : 'Save Profile Settings'}
                            </button>
                        </form>
                    </div>
                );

            case 'logout':
                return (
                    <div className="cp-card-box">
                        <div className="cp-logout-panel">
                            <div className="cp-logout-icon-wrap">
                                <LogOut size={36} />
                            </div>
                            <h3>Sign Out of Account</h3>
                            <p>Are you sure you want to log out of your Venthulir account on this device?</p>
                            <div className="cp-logout-actions">
                                <button type="button" className="cp-btn-outline-teal" onClick={() => navigate('/account')}>Cancel</button>
                                <button type="button" className="cp-btn-logout" onClick={logout}>Yes, Logout Now</button>
                            </div>
                        </div>
                    </div>
                );

            case 'account':
            default:
                // Account Center Overview matching exact user image UI!
                return (
                    <div className="cp-overview-stage">
                        {/* Welcome Back Card */}
                        <div className="cp-welcome-card-box">
                            <div className="cp-welcome-avatar-circle">{userInitial}</div>
                            <div className="cp-welcome-text-details">
                                <h2 className="cp-welcome-title-name">Welcome back, {user?.name || 'Customer'}</h2>
                                <p className="cp-welcome-subtitle-email">{user?.email || 'Logged in'}</p>
                            </div>
                        </div>

                        {/* 2x2 Quick Action Cards Grid (Exact photo match) */}
                        <div className="cp-dashboard-grid-2x2">
                            {/* Card 1: My Orders */}
                            <div className="cp-quick-card" onClick={() => navigate('/account/orders')} role="button" tabIndex="0">
                                <div className="cp-quick-card-icon-wrap">
                                    <Package size={22} className="cp-quick-icon" />
                                </div>
                                <div className="cp-quick-card-info">
                                    <h3>My Orders</h3>
                                    <p>View your order history and tracking.</p>
                                </div>
                            </div>

                            {/* Card 2: Wishlist */}
                            <div className="cp-quick-card" onClick={() => navigate('/account/wishlist')} role="button" tabIndex="0">
                                <div className="cp-quick-card-icon-wrap">
                                    <Heart size={22} className="cp-quick-icon" />
                                </div>
                                <div className="cp-quick-card-info">
                                    <h3>Wishlist</h3>
                                    <p>Open saved items and add more later.</p>
                                </div>
                            </div>

                            {/* Card 3: My Cart */}
                            <div className="cp-quick-card" onClick={() => navigate('/account/cart')} role="button" tabIndex="0">
                                <div className="cp-quick-card-icon-wrap">
                                    <ShoppingCart size={22} className="cp-quick-icon" />
                                </div>
                                <div className="cp-quick-card-info">
                                    <h3>My Cart</h3>
                                    <p>Review or update items before checkout.</p>
                                </div>
                            </div>

                            {/* Card 4: Coupons & Rewards */}
                            <div className="cp-quick-card" onClick={() => navigate('/account/rewards')} role="button" tabIndex="0">
                                <div className="cp-quick-card-icon-wrap">
                                    <Gift size={22} className="cp-quick-icon" />
                                </div>
                                <div className="cp-quick-card-info">
                                    <h3>Coupons & Rewards</h3>
                                    <p>See your available offers and rewards.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="cp-content-stage">
            {pageContent()}
            <InvoiceModal
                isOpen={isInvoiceOpen}
                onClose={() => setIsInvoiceOpen(false)}
                orderData={selectedOrder}
            />
        </div>
    );
};

export default CustomerPage;
