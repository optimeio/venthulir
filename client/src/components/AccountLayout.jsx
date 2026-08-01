import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Package, Heart, ShoppingCart, Gift, Bell, LifeBuoy, Settings, LogOut, ArrowLeft, Lock, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../pages/CustomerPage.css';

const sidebarItems = [
    { id: 'account', label: 'Account Center', Icon: User, path: '/account' },
    { id: 'orders', label: 'My Orders', Icon: Package, path: '/account/orders' },
    { id: 'wishlist', label: 'Wishlist', Icon: Heart, path: '/account/wishlist' },
    { id: 'cart', label: 'My Cart', Icon: ShoppingCart, path: '/account/cart' },
    { id: 'rewards', label: 'Coupons & Rewards', Icon: Gift, path: '/account/rewards' },
    { id: 'support', label: 'Help & Queries', Icon: LifeBuoy, path: '/account/support' },
    { id: 'profile', label: 'Profile Settings', Icon: Settings, path: '/account/profile' }
];

const pageTitleMap = {
    account: 'Account Center',
    orders: 'My Orders',
    wishlist: 'Wishlist',
    cart: 'My Cart',
    rewards: 'Coupons & Rewards',
    support: 'Help & Queries',
    profile: 'Profile Settings'
};

const AccountLayout = () => {
    const { user, isAuthenticated, loading, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const segment = location.pathname.split('/')[2] || 'account';
    const pageTitle = pageTitleMap[segment] || 'Account Center';
    const userName = user?.name || user?.email?.split('@')[0] || 'Customer';

    // 1. Session Loading State
    if (loading) {
        return (
            <div className="cp-dashboard-root">
                <div className="cp-loading-full">
                    <div className="cp-spinner-teal"></div>
                    <p>Loading session...</p>
                </div>
            </div>
        );
    }

    // 2. Auth Protection Guard
    if (!isAuthenticated || !user) {
        return (
            <div className="cp-dashboard-root">
                <header className="cp-dashboard-top-bar">
                    <div className="cp-top-bar-left" onClick={() => navigate('/')}>
                        <span className="cp-logo-mark">🌿</span>
                        <span className="cp-logo-text">MY ACCOUNT</span>
                    </div>
                    <div className="cp-top-bar-main">
                        <h1 className="cp-top-bar-title">Account Access</h1>
                    </div>
                </header>
                <div className="cp-dashboard-body">
                    <div className="cp-auth-gate-wrapper">
                        <div className="cp-auth-card">
                            <Lock size={48} className="cp-lock-icon" />
                            <h2>Sign In Required</h2>
                            <p>Please log in to your Venthulir account to access your orders, profile, and wishlist.</p>
                            <div className="cp-auth-btn-row">
                                <button type="button" className="cp-btn-teal" onClick={() => navigate('/auth')}>
                                    <LogIn size={18} />
                                    <span>Sign In / Register</span>
                                </button>
                                <button type="button" className="cp-btn-outline-teal" onClick={() => navigate('/')}>
                                    <ArrowLeft size={16} />
                                    <span>Return to Store</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="cp-dashboard-root">
            {/* Edge-to-Edge Top Bar Header */}
            <header className="cp-dashboard-top-bar">
                <div className="cp-top-bar-left" onClick={() => { navigate('/'); setIsMobileOpen(false); }} title="Venthulir Home">
                    <span className="cp-logo-mark">🌿</span>
                    <span className="cp-logo-text">MY ACCOUNT</span>
                </div>
                <div className="cp-top-bar-main">
                    <button 
                        type="button" 
                        className="cp-menu-toggle-btn" 
                        onClick={() => setIsMobileOpen(!isMobileOpen)}
                        aria-label="Toggle Navigation Menu"
                    >
                        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <h1 className="cp-top-bar-title">{pageTitle}</h1>
                    <div className="cp-top-bar-user">
                        <span>Welcome, <strong>{userName}</strong></span>
                    </div>
                </div>
            </header>

            {/* Split View Body: Left Sidebar + Right Icy Content Stage */}
            <div className="cp-dashboard-body">
                {isMobileOpen && (
                    <div className="cp-mobile-backdrop" onClick={() => setIsMobileOpen(false)}></div>
                )}

                {/* Left Sidebar */}
                <aside className={`cp-dashboard-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
                    <nav className="cp-sidebar-menu">
                        {sidebarItems.map(item => (
                            <NavLink
                                key={item.id}
                                to={item.path}
                                end={item.id === 'account'}
                                className={({ isActive }) => `cp-sidebar-link${isActive ? ' active' : ''}`}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <item.Icon size={17} className="cp-menu-icon" />
                                <span>{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="cp-sidebar-footer">
                        <button type="button" className="cp-sidebar-action-btn" onClick={() => { navigate('/products'); setIsMobileOpen(false); }}>
                            <ArrowLeft size={16} />
                            <span>Continue Shopping</span>
                        </button>
                        <button type="button" className="cp-sidebar-action-btn btn-signout" onClick={() => { logout(); setIsMobileOpen(false); }}>
                            <LogOut size={16} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="cp-dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AccountLayout;
