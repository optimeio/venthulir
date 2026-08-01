import React, { createContext, useContext, useState, useEffect } from 'react';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState([]);

    useEffect(() => {
        const savedWishlist = localStorage.getItem('venthulir_wishlist');
        if (savedWishlist) {
            try {
                const parsed = JSON.parse(savedWishlist);
                if (Array.isArray(parsed)) {
                    // Standardize all items with _id and id properties
                    const cleaned = parsed.map(item => ({
                        ...item,
                        _id: item._id || item.id,
                        id: item.id || item._id
                    }));
                    setWishlist(cleaned);
                }
            } catch (e) {
                localStorage.removeItem('venthulir_wishlist');
                setWishlist([]);
            }
        }
    }, []);

    const toggleWishlist = (product) => {
        if (!product) return false;
        const productId = product._id || product.id;
        if (!productId) return false;

        let newWishlist;
        const exists = wishlist.some(item => (item._id || item.id) === productId);

        if (exists) {
            newWishlist = wishlist.filter(item => (item._id || item.id) !== productId);
        } else {
            const newItem = {
                ...product,
                _id: productId,
                id: productId
            };
            newWishlist = [...wishlist, newItem];
        }

        setWishlist(newWishlist);
        localStorage.setItem('venthulir_wishlist', JSON.stringify(newWishlist));

        if (window.addOrganicNotification) {
            const msg = exists
                ? `Removed ${product.name || 'item'} from Wishlist`
                : `Added ${product.name || 'item'} to Wishlist`;
            window.addOrganicNotification(msg, 'wishlist');
        }

        return !exists;
    };

    const isInWishlist = (productId) => {
        if (!productId) return false;
        return wishlist.some(item => (item._id || item.id) === productId);
    };

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => useContext(WishlistContext);
