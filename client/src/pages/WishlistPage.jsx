import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAppNavigation } from '../context/NavigationContext';
import { Heart, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';
import './WishlistPage.css';

const WishlistPage = () => {
    const { wishlist, toggleWishlist } = useWishlist();
    const { toggleCart, isInCart } = useCart();
    const { appNavigate } = useAppNavigation();

    const handleAddToCart = (product) => {
        toggleCart(product);
    };

    const handleRemove = (product) => {
        toggleWishlist(product);
    };

    return (
        <div className="wishlist-page-root">
            <div className="wishlist-container">
                {/* Header */}
                <div className="wishlist-header fade-in-up">
                    <div className="header-left">
                        <Heart size={32} className="header-icon" fill="#d4af37" />
                        <div>
                            <h1>Your Wishlist</h1>
                            <p>{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
                        </div>
                    </div>
                    <button
                        className="continue-shopping"
                        type="button"
                        onClick={() => appNavigate('home')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
                    >
                        <ArrowLeft size={16} />
                        Continue Shopping
                    </button>
                </div>

                {wishlist.length === 0 ? (
                    <div className="empty-wishlist fade-in">
                        <Heart size={80} />
                        <h2>Your wishlist is empty</h2>
                        <p>Save your favorite organic products here!</p>
                        <button
                            className="shop-now-btn"
                            type="button"
                            onClick={() => appNavigate('home')}
                            style={{ background: '#0b3d2e', color: '#fff', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', outline: 'none', fontWeight: '700', fontSize: '14px' }}
                        >
                            Browse Products
                        </button>
                    </div>
                ) : (
                    <div className="wishlist-grid">
                        {wishlist.map((item, index) => (
                            <div
                                key={item.id || item._id}
                                className="wishlist-item-card fade-in-up"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                {/* Image */}
                                <div className="item-image">
                                    <img 
                                        src={item.imageUrl || item.image} 
                                        alt={item.name} 
                                        width="300"
                                        height="300"
                                        loading="lazy"
                                    />
                                    <button
                                        className="remove-btn"
                                        type="button"
                                        onClick={() => handleRemove(item)}
                                        aria-label={`Remove ${item.name} from wishlist`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Details */}
                                <div className="item-details">
                                    <span className="item-category">{item.category}</span>
                                    <h3
                                        className="item-name"
                                        onClick={() => appNavigate('product', { id: item.slug || item._id || item.id })}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {item.name}
                                    </h3>
                                    <p className="item-price">₹{item.price}</p>
                                </div>

                                {/* Add to Cart */}
                                <button
                                    className={`add-to-cart-btn ${isInCart(item.id || item._id) ? 'in-cart' : ''}`}
                                    type="button"
                                    onClick={() => handleAddToCart(item)}
                                >
                                    <ShoppingCart size={16} />
                                    {isInCart(item.id || item._id) ? '✓ In Cart - Remove' : 'Add to Cart'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <style>{`
                .fade-in { animation: fadeIn 0.4s ease forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            `}</style>
        </div>
    );
};

export default WishlistPage;
