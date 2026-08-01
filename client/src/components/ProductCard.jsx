import React from 'react';
import { ShoppingCart, Heart, Eye, Check, Zap } from 'lucide-react';

import { useAppNavigation } from '../context/NavigationContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const navContext = useAppNavigation();
    const authContext = useAuth();
    const cartContext = useCart();
    const wishlistContext = useWishlist();

    const appNavigate = navContext?.appNavigate || (() => { });
    const isAuthenticated = authContext?.isAuthenticated || false;
    const { toggleCart, isInCart } = cartContext || { toggleCart: () => { }, isInCart: () => false };
    const { wishlist, toggleWishlist } = wishlistContext || { wishlist: [], toggleWishlist: () => { } };

    // Prevent crashes if contexts are missing (e.g., in Admin preview)
    const productId = product?._id || product?.id;
    const productSlugOrId = product?.slug || productId;
    const defaultVariant = product?.variants && product.variants.length > 0 ? product.variants[0] : null;
    const isWishlisted = wishlist ? wishlist.some(item => (item._id || item.id) === productId) : false;
    const inCart = isInCart ? isInCart(productId, defaultVariant?.label) : false;

    // Parse dynamic new arrival status (last 7 days)
    let isNewArrival = false;
    if (product?.createdAt) {
        const productDate = new Date(product.createdAt);
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (productDate >= thirtyDaysAgo) isNewArrival = true;
    }

    // Determine priority badge
    const computedBadge = product?.badge ? product.badge : (isNewArrival ? 'New Arrival' : null);

    // MEGA OFFER LOGIC
    const currentPrice = defaultVariant ? defaultVariant.price : product.price;
    let mrp = product.originalPrice;
    let displayDiscount = product.discountPercent;
    const basePrice = product.price || currentPrice;

    if (displayDiscount) {
        mrp = Math.round(currentPrice / (1 - (displayDiscount / 100)));
    } else if (mrp) {
        displayDiscount = Math.round(((mrp - basePrice) / mrp) * 100);
        if (displayDiscount <= 0) displayDiscount = 30;

        if (currentPrice === basePrice && product.originalPrice > currentPrice) {
            mrp = product.originalPrice;
        } else {
            mrp = Math.round(currentPrice / (1 - (displayDiscount / 100)));
        }
    } else {
        // Full illusion default
        displayDiscount = 30;
        mrp = Math.round(currentPrice / 0.7);
    }

    // ELECTRIC EFFECT LOGIC: Triggered by the "Best Seller" badge
    const isBestSeller = computedBadge === 'Best Seller' || product?.isBestSeller;

    const handleCartToggle = (e) => {
        e.stopPropagation();
        if (!cartContext) return;
        const cartProduct = defaultVariant
            ? { ...product, price: defaultVariant.price, selectedVariant: defaultVariant.label }
            : product;
        toggleCart(cartProduct);
    };

    const handleBuyNow = (e) => {
        e.stopPropagation();
        if (!navContext) return;
        if (isAuthenticated) {
            appNavigate('checkout', { productId, variant: defaultVariant?.label, quantity: 1 });
        } else {
            appNavigate('auth', { redirectView: 'checkout', redirectParams: { productId, variant: defaultVariant?.label, quantity: 1 } });
        }
    };

    const handleWishlist = (e) => {
        e.stopPropagation();
        if (!wishlistContext) return;
        toggleWishlist(product);
    };

    return (
        <div
            className={`venthulir-product-card fade-in-up ${isBestSeller ? 'electric-thunder' : ''}`}
            onClick={() => appNavigate('product', { id: productSlugOrId })}
            onKeyDown={(e) => { if (e.key === 'Enter') appNavigate('product', { id: productSlugOrId }) }}
            role="button"
            tabIndex="0"
            aria-label={`View product details for ${product.name}`}
            style={{ cursor: 'pointer' }}
        >
            <div className="card-media">
                <div style={{ width: '100%', height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', overflow: 'hidden' }}>
                    {(product.imageUrl || product.images?.[0] || product.image) ? (
                        <img
                            src={product.imageUrl || product.images?.[0] || product.image}
                            alt={product.name}
                            className="product-img"
                            loading="lazy"
                            decoding="async"
                            width="240"
                            height="240"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/organic.png';
                            }}
                            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
                        />
                    ) : (
                        <div style={{ color: '#aaa', fontSize: '14px', fontWeight: 'bold' }}>VENTHULIR</div>
                    )}

                </div>

                {computedBadge && (
                    <div className="status-badge">
                        {isBestSeller && <Zap size={10} fill="currentColor" />} {computedBadge}
                    </div>
                )}

                <div className="hover-actions">
                    <button className="icon-btn" title="Quick View" aria-label="Quick view product">
                        <Eye size={18} />
                    </button>
                    <button
                        className={`icon-btn ${isWishlisted ? 'active-red' : ''}`}
                        onClick={handleWishlist}
                        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                        title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                        <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} />
                    </button>
                </div>
            </div>

            <div className="card-body">
                <div className="text-header">
                    <span className="cat-label">{product.category}</span>
                    <h3 className="product-title big-title">{product.name}</h3>
                </div>

                <div className="offer-illusion">
                    <span className="discount-tag">-{displayDiscount}% OFF</span>
                    <span className="mega-tag">MEGA OFFER</span>
                </div>

                <div className="pricing-section">
                    <div className="price-container">
                        <span className="price-symbol">₹</span>
                        <span className="price-value">{currentPrice}</span>
                        <span className="mrp-value">M.R.P: <s>₹{mrp}</s></span>
                    </div>
                </div>

                {defaultVariant && (
                    <div style={{
                        background: '#f0f9f4',
                        color: 'var(--dark-green)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '900',
                        border: '1px solid #e0eee6',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                    }}>
                        {defaultVariant.label}
                    </div>
                )}

                <div className="button-footer">
                    <button
                        className={`cart-action-btn ${inCart ? 'item-added' : ''}`}
                        onClick={handleCartToggle}
                    >
                        {inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
                        <span>{inCart ? 'ADDED' : 'ADD TO CART'}</span>
                    </button>
                    <button className="buy-now-btn" onClick={handleBuyNow}>BUY NOW</button>
                </div>
            </div>

            {/* React Bits Thunder Glow Effect */}
            {isBestSeller && <div className="thunder-visual-glow"></div>}
        </div>
    );
};

export default ProductCard;