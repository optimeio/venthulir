import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, ChevronDown, Menu, X as CloseIcon } from 'lucide-react';
import { useAppNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AuthModal from './AuthModal';
import logo from '../assets/organic.png';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, login } = useAuth();
  const { getTotalItems } = useCart();
  const { wishlist } = useWishlist();
  const { currentView, appNavigate } = useAppNavigation();
  const navigate = useNavigate();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    setIsMobileMenuOpen(false);
    if (currentView !== 'home') {
      appNavigate('home');
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="at-header-root">
      <div className="at-top-bar">
        <div className="at-ticker-wrap">
          <div className="at-ticker-move">
            {[...Array(8)].map((_, i) => (
              <span key={i}>🔥 Limited Time Offer – 10% OFF on First Order &nbsp; • &nbsp; 🎁 Free Shipping Above ₹499 &nbsp; • &nbsp; 🌿 Venthulir Organic Harvest 👑 &nbsp; • &nbsp; </span>
            ))}
          </div>
        </div>
      </div>

      <nav className="at-navbar-main">
        <div className="at-nav-container">
          <div className="at-nav-left">
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleMobileMenu}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-menu"
            >
              {isMobileMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
            </button>
            <div className="at-brand-logo-wrap" role="button" aria-label="Go to Home" tabIndex="0" style={{ cursor: 'pointer' }} onClick={() => { setIsMobileMenuOpen(false); appNavigate('home'); }} onKeyDown={(e) => { if (e.key === 'Enter') { setIsMobileMenuOpen(false); appNavigate('home'); } }}>
              <img src={logo} alt="Venthulir Logo" width="98" height="55" style={{ height: '55px', objectFit: 'contain' }} />
            </div>
          </div>

          <div className="at-nav-actions">
            <div className="at-action-item profile-trigger" role="button" tabIndex="0" aria-label="Profile" onKeyDown={(e) => { if (e.key === 'Enter') { if (!isAuthenticated) return navigate('/auth'); appNavigate('profile'); } }} onClick={() => {
              if (!isAuthenticated) return navigate('/auth');
              appNavigate('profile');
            }}>
              <div className="at-profile-icon-frame">
                {isAuthenticated && user?.avatar ? (
                  <img src={user.avatar} alt="User" className="at-user-avatar" />
                ) : (
                  <User size={20} className="at-royal-icon" />
                )}
              </div>
              <div className="at-action-label">
                <span className="at-label-top">{isAuthenticated ? user?.name.split(' ')[0] : 'Hello, Guest'}</span>
                <span className="at-label-bot">Account <ChevronDown size={10} /></span>
              </div>
            </div>

            <div className="at-icon-btn" role="button" tabIndex="0" aria-label="Wishlist" style={{ cursor: 'pointer' }} onClick={() => appNavigate('wishlist')} onKeyDown={(e) => { if(e.key === 'Enter') appNavigate('wishlist'); }}>
              <Heart size={22} />
              {wishlist.length > 0 && <span className="at-badge gold">{wishlist.length}</span>}
            </div>

            <div className="at-cart-btn" role="button" tabIndex="0" aria-label="Cart" style={{ cursor: 'pointer' }} onClick={() => appNavigate('cart')} onKeyDown={(e) => { if(e.key === 'Enter') appNavigate('cart'); }}>
              <ShoppingCart size={22} />
              <span className="at-cart-text">Cart ({getTotalItems()})</span>
            </div>
          </div>
        </div>
      </nav>

      <div className={`at-sub-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="at-sub-nav-links">
          <button className={`at-sub-link ${currentView === 'home' ? 'active' : ''}`} onClick={() => { setIsMobileMenuOpen(false); appNavigate('home'); }}>Home</button>
          <button onClick={() => scrollToSection('products')} className="at-sub-link">Products</button>
          <button className={`at-sub-link ${currentView === 'new-arrivals' ? 'active' : ''}`} onClick={() => { setIsMobileMenuOpen(false); appNavigate('new-arrivals'); }}>New Arrivals</button>
        </div>
      </div>


      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onLoginSuccess={login} />
    </header >
  );
};

export default Navbar;
