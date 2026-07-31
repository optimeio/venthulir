import React, { useState, useEffect, useRef } from 'react';
import { useAppNavigation } from '../context/NavigationContext';
import './MotionLayer.css';

const MotionLayer = () => {
    const { appNavigate } = useAppNavigation();

    const products = [
        { id: 'sambar',    src: '/products/sambar.png',    name: 'Traditional Sambar',  tag: 'Authentic South Indian Blend' },
        { id: 'chilli',    src: '/products/chilli.png',    name: 'Original Salem Chilli', tag: 'Handpicked & Sun-Dried' },
        { id: 'coriander', src: '/products/coriander.png', name: 'Fresh Coriander',      tag: 'Aromatic & Pure' }
    ];

    const [activeIndex, setActiveIndex] = useState(0);

    // Track window width reactively so responsive positions stay correct after resize
    const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Auto-cycle every 3.5 s
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex(current => (current + 1) % products.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [products.length]);

    /**
     * Card positions for a clean 3-card stack:
     *
     *   queuePos 0 → FRONT  (full size, fully visible)
     *   queuePos 1 → BEHIND (scaled back, peeking above the front card)
     *   queuePos 2 → EXIT   (flies off to the side, invisible)
     *
     * CRITICAL z-index order: exit(8) < behind(9) < front(10)
     * Previously exit was 11 which caused it to silently block the front card.
     */
    const getCardStyles = (queuePos) => {
        const outX = isMobile ? 70  : 260;
        const bgY  = isMobile ? -48 : -58;

        switch (queuePos) {
            case 0: // Front — hero card
                return { x: 0,    y: isMobile ? -8 : 14,  scale: 1.05, zIndex: 10, opacity: 1,   rotate: 0  };
            case 1: // Behind — peeking card
                return { x: 0,    y: bgY,                  scale: 0.85, zIndex: 9,  opacity: 0.55, rotate: 0  };
            case 2: // Exit — flies off screen, invisible
                return { x: outX, y: -18,                  scale: 0.88, zIndex: 8,  opacity: 0,   rotate: 22 };
            default:
                return { x: 0,    y: 0,                    scale: 0,    zIndex: 0,  opacity: 0,   rotate: 0  };
        }
    };

    return (
        <section className="premium-hero-container">
            {/* Ambient Background Glow */}
            <div className="premium-glow-sphere"></div>

            <div className="premium-hero-content">
                {/* Left Side: Dramatic Typography */}
                <div className="hero-text-column">
                    <div className="brand-eyebrow">
                        <span className="organic-dot"></span> 100% PURE &amp; TRADITIONAL
                    </div>

                    <h1 className="hero-monumental-title" style={{ fontSize: '54px', lineHeight: '1.1' }}>
                        100% Natural Herbal<br />
                        <span className="text-highlight">Products</span> for Healthy<br />Everyday Living 🌿
                    </h1>

                    <p className="hero-sophisticated-desc">
                        Chemical-free powders &amp; wellness products made with traditional ingredients.
                    </p>

                    <div className="hero-action-row">
                        <button
                            className="premium-primary-btn"
                            onClick={() => {
                                document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            Shop Now
                        </button>
                        <button
                            className="premium-secondary-btn"
                            onClick={() => {
                                window.scrollTo(0, 0);
                                appNavigate('all-products');
                            }}
                        >
                            View Best Sellers
                        </button>
                    </div>
                </div>

                {/* Right Side: The 3-Card Stack */}
                <div className="hero-visual-column">
                    <div className="epic-stack-stage">
                        {products.map((p, i) => {
                            const queuePos = (i - activeIndex + products.length) % products.length;
                            const styles   = getCardStyles(queuePos);

                            return (
                                <div
                                    key={p.id}
                                    className={`epic-stack-card${queuePos === 0 ? ' active-salute' : ''}`}
                                    style={{
                                        position:   'absolute',
                                        transform:  `translate(${styles.x}px, ${styles.y}px) scale(${styles.scale}) rotate(${styles.rotate}deg)`,
                                        opacity:    styles.opacity,
                                        zIndex:     styles.zIndex,
                                        // Separate transitions: don't transition zIndex (instant jump prevents ghosting)
                                        transition: 'transform 0.9s cubic-bezier(0.25, 1, 0.4, 1), opacity 0.9s cubic-bezier(0.25, 1, 0.4, 1)',
                                        cursor:     'pointer',
                                        // Prevent the invisible exit card from capturing pointer events
                                        pointerEvents: queuePos === 0 ? 'auto' : 'none',
                                    }}
                                    onClick={() => setActiveIndex(i)}
                                    role="button"
                                    aria-label={`Show ${p.name}`}
                                    tabIndex={queuePos === 0 ? 0 : -1}
                                    onKeyDown={e => { if (e.key === 'Enter') setActiveIndex(i); }}
                                >
                                    <div className="product-image-wrapper">
                                        <img
                                            src={p.src}
                                            alt={p.name}
                                            loading="eager"
                                            draggable="false"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Luxury texture overlay */}
            <div className="luxury-noise-overlay"></div>
        </section>
    );
};

export default MotionLayer;