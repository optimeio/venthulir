import React, { useState, useEffect, Suspense } from 'react';
import Hero from '../components/Hero';
import ShopGrid from '../components/ShopGrid';
import Footer from '../components/Footer';
import SpecialOffers from '../components/SpecialOffers';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, Truck, RefreshCcw, Leaf, ChevronRight, BookOpen } from 'lucide-react';
import { useAppNavigation } from '../context/NavigationContext';
import './Home.css';

const Home = () => {
    const { appNavigate } = useAppNavigation();
    const [carouselStart, setCarouselStart] = useState(3);
    const [slideDirection, setSlideDirection] = useState(null);

    const reviews = [
        {
            quote: 'Venthulir masalas have changed my cooking. The blend is fragrant, fresh, and gives every dish a perfect, authentic kick.',
            name: 'Maya',
            subtitle: 'House Wife'
        },
        {
            quote: 'The spice mix is so balanced and aromatic. Our guests keep asking for the curry recipe — it tastes rich without being too heavy.',
            name: 'Harshath',
            subtitle: 'Chef'
        },
        {
            quote: 'The masala powder feels premium and pure. I can smell the freshness as soon as I open the packet, and my home-cooked meals now taste restaurant-quality.',
            name: 'Aswini',
            subtitle: 'Home Cook'
        },
        {
            quote: 'The garam masala from Venthilir adds such depth to our family meals. Every dish feels more vibrant and true to South Indian tradition.',
            name: 'Shivanya',
            subtitle: 'House Wife'
        },
        {
            quote: 'I love how the spice blend is warm without being overpowering. It makes simple dals and curries sing with real flavor.',
            name: 'Rosan',
            subtitle: 'Cooking Enthusiast'
        }
    ];

    const visibleReviews = Array.from({ length: 3 }, (_, index) => reviews[(carouselStart + index) % reviews.length]);

    const step = 1;
    const handlePrev = () => {
        setSlideDirection('left');
        setCarouselStart((prev) => (prev - step + reviews.length) % reviews.length);
    };
    const handleNext = () => {
        setSlideDirection('right');
        setCarouselStart((prev) => (prev + step) % reviews.length);
    };

    useEffect(() => {
        if (!slideDirection) return;
        const timer = setTimeout(() => setSlideDirection(null), 280);
        return () => clearTimeout(timer);
    }, [slideDirection]);

    // Removed warmup fetch to prevent chaining critical request penalty

    return (
        <div className="home-unified-root">
            <Helmet>
                <title>Venthulir | Wood-Pressed Oils, Honey &amp; Spices — Salem</title>
                <meta name="description" content="Buy 100% natural wood-pressed oils, raw forest honey & pure spices. Venthulir is Salem's trusted organic store. Chemical-free transport across India." />
                <meta name="keywords" content="buy wood pressed oil Salem, organic honey Salem, cold pressed sesame oil Tamil Nadu, pure coconut oil Salem, traditional spices online, chemical-free oils India, venthulir organic harvest" />
                <link rel="canonical" href="https://venthulir.com/" />
                <script type="application/ld+json">
                    {`
                    {
                      "@context": "https://schema.org",
                      "@type": "Organization",
                      "name": "Venthulir Organic Harvest",
                      "url": "https://venthulir.com/",
                      "logo": "https://venthulir.com/logo.png",
                      "contactPoint": {
                        "@type": "ContactPoint",
                        "telephone": "+91-8778476414",
                        "contactType": "Customer Service",
                        "areaServed": "IN",
                        "availableLanguage": "en"
                      },
                      "sameAs": [
                        "https://www.facebook.com/venthulir",
                        "https://www.instagram.com/venthulir"
                      ]
                    }
                    `}
                </script>
            </Helmet>

            <Hero />
            {/* THE STORY OF VENTHULIR - LOCAL IMAGE BACKGROUND */}
            <section style={{ position: 'relative', overflow: 'hidden', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(60px, 10vw, 120px) 20px' }}>
                {/* BG image from public/story.jpg */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: 'url(/story.jpg)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    zIndex: 0
                }}></div>
                {/* Dark overlay so text stays readable */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(13, 31, 45, 0.80)', zIndex: 1 }}></div>

                <div style={{ position: 'relative', zIndex: 2, maxWidth: '860px', margin: '0 auto', padding: 'clamp(25px, 5vw, 50px)', background: 'rgba(255, 255, 255, 0.07)', backdropFilter: 'blur(12px)', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.15)', textAlign: 'center', color: '#fff', boxShadow: '0 30px 60px rgba(0,0,0,0.4)', width: '100%', boxSizing: 'border-box' }} className="fade-in-up">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 20px', background: 'rgba(201, 168, 76, 0.2)', color: '#c9a84c', borderRadius: '30px', fontWeight: 'bold', fontSize: '13px', marginBottom: '25px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                        <Leaf size={14} />
                        Our Origin Story
                    </div>

                    <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 42px)', fontWeight: '900', fontFamily: '"Playfair Display", serif', lineHeight: '1.25', marginBottom: '25px', color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
                        A Journey from Childhood Dream<br />to Organic Revolution 🌱
                    </h2>

                    <div style={{ fontSize: 'clamp(15px, 2.5vw, 18px)', lineHeight: '1.85', color: '#f0f0f0', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                        <p style={{ marginBottom: '18px' }}>
                            The story begins with a young boy watching people consume chemically processed foods daily. Noticing how these unhealthy choices deteriorated their fitness and lifestyle planted a strong purpose in his heart — a mission to reconnect humanity with the purity of nature.
                        </p>
                        <p style={{ marginBottom: '18px' }}>
                            Driven by the belief that <strong style={{ color: '#d4af37' }}>&ldquo;Pure Food Creates a Pure Life,&rdquo;</strong> he founded Venthulir — owning and cultivating fertile, chemical-free organic farms across Tamil Nadu, with zero reliance on external sourcing.
                        </p>
                        <p>
                            Today, Venthulir is more than a brand; it's a conscious movement. Every product is organically crafted to ensure people stay fit and energetic—a symbol of trust, sustainability, and a healthier tomorrow.
                        </p>
                    </div>

                    <button
                        onClick={() => { document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
                        style={{ marginTop: '35px', background: '#d4af37', color: '#111', padding: '14px 38px', fontSize: 'clamp(15px, 2.5vw, 18px)', fontWeight: 'bold', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(0,0,0,0.25)', transition: 'all 0.3s ease' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 28px rgba(0,0,0,0.35)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)'; }}
                    >
                        Experience Purity
                    </button>
                </div>
            </section>

            {/* MEET THE LEADERSHIP SECTION */}
            <section style={{ padding: '80px 20px', background: 'linear-gradient(135deg, #0d1f2d 0%, #1a3a4a 100%)', color: '#fff' }}>
                <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', color: '#c9a84c', fontWeight: '900', marginBottom: '10px', fontFamily: '"Playfair Display", serif', textAlign: 'center' }}>
                        Meet Our Leadership
                    </h2>
                    <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.65)', fontSize: '15px', marginBottom: '55px', letterSpacing: '0.5px' }}>
                        The people behind Venthulir's vision of purity
                    </p>

                    {/* Leadership Cards Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                        {/* --- CEO Card --- */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: 'clamp(25px, 5vw, 40px)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 0.3s ease', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.35)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                        >
                            {/* Photo */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <img
                                    src="/sankarganesh.png"
                                    alt="Sankarganesh R — CEO & Founder of Venthulir Organic Harvest"
                                    width="130" height="130"
                                    style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '4px solid #c9a84c', boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        const fb = document.getElementById('founder-fallback');
                                        if (fb) fb.style.display = 'flex';
                                    }}
                                />
                                <div id="founder-fallback" style={{ display: 'none', width: '130px', height: '130px', borderRadius: '50%', border: '4px solid #d4af37', background: '#062017', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '900', color: '#d4af37', boxShadow: '0 0 30px rgba(212,175,55,0.25)' }}>SR</div>
                                {/* Role badge */}
                                <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#c9a84c', color: '#0d1f2d', fontSize: '11px', fontWeight: '900', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>CEO & FOUNDER</div>
                            </div>

                            {/* Name & Title */}
                            <h3 style={{ fontSize: '22px', color: '#fff', fontWeight: '800', marginBottom: '4px', marginTop: '12px' }}>Sankarganesh R</h3>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '18px', letterSpacing: '0.3px' }}>B.E (Mechanical) · M.Tech (Energy Technology)</p>

                            {/* Divider */}
                            <div style={{ width: '50px', height: '3px', background: '#d4af37', borderRadius: '2px', marginBottom: '20px' }}></div>

                            {/* Bio */}
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.75', marginBottom: '22px', textAlign: 'center' }}>
                                A seasoned mechanical engineer and strategic entrepreneur, Sankarganesh R. leads Venthulir with a mandate to redefine the organic sector through operational excellence, farm-to-consumer transparency, and science-backed wellness standards.
                            </p>

                            {/* Roles */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: 'auto' }}>
                                {['Strategic Leadership', 'Organic Innovation', 'Team Development', 'Project Governance', 'CEO & Founder'].map((role) => (
                                    <span key={role} style={{ fontSize: '12px', fontWeight: '600', color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', padding: '4px 12px', borderRadius: '20px' }}>{role}</span>
                                ))}
                            </div>
                        </div>

                        {/* --- Managing Director Card --- */}
                        <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '20px', padding: 'clamp(25px, 5vw, 40px)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', transition: 'all 0.3s ease', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.35)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                        >
                            {/* Avatar (initials) */}
                            <div style={{ position: 'relative', marginBottom: '20px' }}>
                                <img
                                    src="/ganga.jpg"
                                    alt="Ganga — Managing Director of Venthulir Organic Harvest"
                                    width="130" height="130"
                                    style={{ width: '130px', height: '130px', borderRadius: '50%', objectFit: 'cover', objectPosition: 'center top', border: '4px solid #c9a84c', boxShadow: '0 0 30px rgba(201,168,76,0.3)' }}
                                    loading="lazy"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.style.display = 'none';
                                        const fb = document.getElementById('ganga-fallback');
                                        if (fb) fb.style.display = 'flex';
                                    }}
                                />
                                <div id="ganga-fallback" style={{ display: 'none', width: '130px', height: '130px', borderRadius: '50%', border: '4px solid #d4af37', background: 'linear-gradient(135deg, #082f23, #0f5c3a)', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '900', color: '#d4af37', boxShadow: '0 0 30px rgba(212,175,55,0.25)' }}>G</div>
                                {/* Role badge */}
                                <div style={{ position: 'absolute', bottom: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#c9a84c', color: '#0d1f2d', fontSize: '11px', fontWeight: '900', padding: '3px 12px', borderRadius: '20px', whiteSpace: 'nowrap', letterSpacing: '0.5px' }}>MANAGING DIRECTOR</div>
                            </div>

                            {/* Name & Title */}
                            <h3 style={{ fontSize: '22px', color: '#fff', fontWeight: '800', marginBottom: '4px', marginTop: '12px' }}>Ganga</h3>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '18px', letterSpacing: '0.3px' }}>B.Com · M.Com</p>

                            {/* Divider */}
                            <div style={{ width: '50px', height: '3px', background: '#d4af37', borderRadius: '2px', marginBottom: '20px' }}></div>

                            {/* Bio */}
                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.75', marginBottom: '22px', textAlign: 'center' }}>
                                A commerce-driven executive, Ganga steers Venthulir's corporate strategy, financial operations, and brand governance — ensuring every business decision upholds the highest standards of integrity, sustainability, and market leadership.
                            </p>

                            {/* Roles */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginTop: 'auto' }}>
                                {['Corporate Strategy', 'Financial Oversight', 'Brand Governance', 'Managing Director'].map((role) => (
                                    <span key={role} style={{ fontSize: '12px', fontWeight: '600', color: '#c9a84c', background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', padding: '4px 12px', borderRadius: '20px' }}>{role}</span>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* WHY VENTHULIR - TRUST AND BENEFITS SECTION */}
            <section style={{ padding: '80px 20px', background: '#f4f2ec', textAlign: 'center' }}>
                <h2 style={{ fontSize: '36px', color: '#0d1f2d', fontWeight: '900', marginBottom: '40px', fontFamily: '"Playfair Display", serif' }}>Why Venthulir?</h2>
                <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '30px', alignItems: 'center' }}>
                    <p style={{ fontSize: '18px', lineHeight: '1.8', color: '#555', maxWidth: '800px' }}>
                        Started with a mission to bring traditional herbal wellness back to modern homes.
                        We ensure small-batch preparation and source directly from local farmers so that every product is 100% pure, natural, and rigorously quality tested.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px', width: '100%', marginTop: '30px' }}>
                        <div className="trust-badge-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '50%', color: '#2e7d32' }}><Leaf size={40} /></div>
                            <h3 style={{ fontSize: '18px', color: '#0b3d2e', fontWeight: 'bold' }}>Natural Ingredients</h3>
                            <p style={{ fontSize: '14px', color: '#666' }}>100% pure & chemical-free</p>
                        </div>
                        <div className="trust-badge-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '50%', color: '#2e7d32' }}><ShieldCheck size={40} /></div>
                            <h3 style={{ fontSize: '18px', color: '#0b3d2e', fontWeight: 'bold' }}>Secure Payment</h3>
                            <p style={{ fontSize: '14px', color: '#666' }}>Safe & encrypted checkouts</p>
                        </div>
                        <div className="trust-badge-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '50%', color: '#2e7d32' }}><Truck size={40} /></div>
                            <h3 style={{ fontSize: '18px', color: '#0b3d2e', fontWeight: 'bold' }}>Fast Shipping</h3>
                            <p style={{ fontSize: '14px', color: '#666' }}>Reliable delivery across India</p>
                        </div>
                        <div className="trust-badge-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                            <div style={{ padding: '20px', background: '#e8f5e9', borderRadius: '50%', color: '#2e7d32' }}><RefreshCcw size={40} /></div>
                            <h3 style={{ fontSize: '18px', color: '#0b3d2e', fontWeight: 'bold' }}>Easy Return</h3>
                            <p style={{ fontSize: '14px', color: '#666' }}>Hassle-free return policy</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* SPECIAL LIMITED OFFERS — shown above Best Sellers */}
            <SpecialOffers />

            {/* MAIN PRODUCTS SECTION */}
            <ShopGrid title="Our Best Sellers" isHomePage={true} id="products" />

            {/* TESTIMONIALS */}
            <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(15px, 5vw, 20px)', background: 'linear-gradient(135deg, #0d1f2d 0%, #1a3a4a 100%)', color: '#fff', textAlign: 'center' }}>
                <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', marginBottom: '40px', fontFamily: '"Playfair Display", serif', color: '#c9a84c' }}>What Our Customers Say</h2>
                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <p style={{ fontSize: 'clamp(18px, 4vw, 22px)', fontStyle: 'italic', lineHeight: '1.8', marginBottom: '30px' }}>
                        "The purity and aroma of Venthulir spices are unmatched. It feels like returning to the food our grandparents used to make. Absolutely loving it!"
                    </p>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>— Kavitha R., Salem</div>
                </div>
            </section>

            {/* OFFER BANNER */}
            <section style={{ padding: '10px 20px', background: '#cc0c39', color: '#fff' }} className="fade-in-up">
                <div className="offer-flex-banner" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '28px' }}>🔥</span>
                        <h2 style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: '900', margin: 0, textTransform: 'uppercase' }}>Limited Time Offer</h2>
                    </div>

                    <p style={{ fontSize: 'clamp(16px, 2.5vw, 18px)', margin: 0, fontWeight: '500', flexGrow: 1, textAlign: 'center' }}>
                        Get <span style={{ fontWeight: 'bold', color: '#ffea00' }}>10% OFF</span> on your First Order + 🎁 <span style={{ fontWeight: 'bold', color: '#ffea00' }}>Free Shipping</span> Above ₹499!
                    </p>

                    <button
                        onClick={() => { document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }); }}
                        style={{ background: '#ffcd00', color: '#111', padding: '12px 30px', fontSize: '16px', fontWeight: 'bold', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 5px 15px rgba(0,0,0,0.2)', transition: 'all 0.3s ease', whiteSpace: 'nowrap' }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)'; }}
                    >
                        Claim Offer Now
                    </button>
                </div>
            </section>

            {/* BLOG PREVIEW */}
            <section style={{ padding: 'clamp(40px, 8vw, 80px) clamp(15px, 5vw, 20px)', background: '#fff' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }} className="fade-in-up">
                        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', color: '#0b3d2e', fontWeight: '900', fontFamily: '"Playfair Display", serif', marginBottom: '10px' }}>Wellness Journal</h2>
                        <div style={{ width: '60px', height: '4px', background: '#d4af37', margin: '0 auto', borderRadius: '2px' }}></div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '40px' }}>
                        {[
                            {
                                title: 'Benefits of Turmeric Powder',
                                snippet: 'Discover why this golden spice is essential for your daily immunity and overall well-being...',
                                image: '/journal-turmeric.jpg',
                                delay: 'delay-1'
                            },
                            {
                                title: 'Herbal Remedies for Immunity',
                                snippet: 'Traditional concoctions you can make at home to stay strong and healthy during weather changes...',
                                image: '/journal-herbs.jpg',
                                delay: 'delay-2'
                            },
                            {
                                title: 'Natural vs Chemical Spices',
                                snippet: 'A deep dive into why pure organic spices matter for your diet and long-term vitality...',
                                image: '/journal-spices.jpg',
                                delay: 'delay-3'
                            }
                        ].map((post, idx) => (
                            <div
                                key={idx}
                                className={`fade-in-up ${post.delay}`}
                                onClick={() => appNavigate('journal', { post })}
                                style={{ background: '#fdfcf7', borderRadius: '16px', overflow: 'hidden', border: '1px solid #f0f0f0', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', display: 'flex', flexDirection: 'column', position: 'relative' }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-12px)';
                                    e.currentTarget.style.boxShadow = '0 25px 50px rgba(11, 61, 46, 0.15)';
                                    e.currentTarget.querySelector('.journal-img').style.transform = 'scale(1.1)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.05)';
                                    e.currentTarget.querySelector('.journal-img').style.transform = 'scale(1)';
                                }}
                            >
                                <div style={{ width: '100%', height: '220px', overflow: 'hidden', position: 'relative' }}>
                                    <div className="journal-img" style={{ width: '100%', height: '100%', backgroundImage: `url(${post.image})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'transform 0.6s ease' }}></div>
                                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: 'rgba(255,255,255,0.9)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', color: '#0b3d2e', backdropFilter: 'blur(5px)' }}>Read</div>
                                </div>
                                <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', flexGrow: 1, position: 'relative', zIndex: 2, background: '#fff' }}>
                                    <h3 style={{ fontSize: 'clamp(18px, 3vw, 22px)', color: '#0b3d2e', fontWeight: '900', fontFamily: '"Playfair Display", serif', marginBottom: '15px', lineHeight: '1.3' }}>{post.title}</h3>
                                    <p style={{ fontSize: '15px', color: '#555', lineHeight: '1.7', flexGrow: 1, marginBottom: '20px' }}>{post.snippet}</p>
                                    <div style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                                        Explore Article <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAKE REVIEWS SECTION */}
            <section className="testimonials-section">
                <div className="testimonials-inner">
                    <div className="testimonials-heading-wrap">
                        <h2 style={{ fontSize: 'clamp(28px, 5vw, 36px)', color: '#184824', fontFamily: '"Playfair Display", serif', fontWeight: '900', marginBottom: '12px' }}>What Our Early Adopters Are Saying</h2>
                        <p style={{ maxWidth: '760px', margin: '0 auto', color: '#4e6b55', fontSize: '16px', lineHeight: '1.8' }}>
                            Real feedback from customers who experienced Venthulir's purity, flavor, and wellness boost first-hand.
                        </p>
                    </div>

                    <div className="testimonials-carousel-frame">
                        <div className="testimonials-carousel-row" style={{ transform: slideDirection === 'left' ? 'translateX(24px)' : slideDirection === 'right' ? 'translateX(-24px)' : 'translateX(0)' }}>
                            {visibleReviews.map((review, index) => {
                                const isActive = index === 1;
                                return (
                                    <div key={`${review.name}-${review.quote}`} className={`testimonial-card${isActive ? ' active' : ''}`}>
                                        <div className="testimonial-card-content">
                                            <div className="testimonial-card-stars">
                                                {Array.from({ length: 5 }).map((_, index) => (
                                                    <span key={index} style={{ color: '#d4af37', fontSize: '18px' }}>★</span>
                                                ))}
                                            </div>
                                            <p className="testimonial-quote">
                                                “{review.quote}”
                                            </p>
                                        </div>
                                        <div className="testimonial-card-meta">
                                            <div className="testimonial-name" style={{ color: isActive ? '#154427' : '#1d4228' }}>{review.name}</div>
                                            <div className="testimonial-role">{review.subtitle}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="testimonial-nav">
                        <button
                            onClick={handlePrev}
                            className="testimonial-nav-button"
                            aria-label="Previous reviews"
                        >
                            ‹
                        </button>
                        <button
                            onClick={handleNext}
                            className="testimonial-nav-button"
                            aria-label="Next reviews"
                        >
                            ›
                        </button>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Home;