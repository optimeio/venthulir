import React, { useState } from 'react';
import { ChevronUp, Send, CreditCard, ShieldCheck } from 'lucide-react';
import './Footer.css';

const Footer = () => {
    const [formData, setFormData] = useState({ name: '', orderId: '', email: '', concern: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://venthulir-1ehl.onrender.com/api' : 'http://localhost:7000/api');
            const combinedMessage = `[Order: ${formData.orderId}] [Concern: ${formData.concern}] ${formData.message}`;
            const res = await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName: formData.name,
                    customerEmail: formData.email,
                    message: combinedMessage
                })
            });
            if (res.ok) {
                setIsSubmitted(true);
                setFormData({ name: '', orderId: '', email: '', concern: '', message: '' });
                // Reset form after 3 seconds so they can send another message
                setTimeout(() => setIsSubmitted(false), 3000);
            } else {
                alert('Failed to log grievance. Please try again.');
            }
        } catch (err) {
            console.error(err);
            alert('Service currently unavailable.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const backToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    return (
        <footer className="imperial-footer-beige">
            <button className="back-to-top" onClick={backToTop} title="Back to Top">
                <ChevronUp size={24} />
            </button>

            <div className="footer-main-wrapper">
                <div className="footer-grid-layout">

                    {/* LEFT: OUR ROOTS & CONTACT */}
                    <div className="footer-column" id="roots">
                        <h3 className="royal-green-title">OUR ROOTS</h3>
                        <p className="footer-p" style={{ marginBottom: '20px' }}>
                            Deeply embedded in the heritage of Salem's fertile lands, Venthulir is a preservation of ancestral wisdom. We bypass industrial processing to bring you wood-pressed oils and forest-fresh harvests.
                        </p>
                        <h3 className="royal-green-title" style={{ marginTop: '20px', marginBottom: '15px' }}>REACH US</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', color: '#1a1a1a', fontSize: '13px' }}>

                            {/* Google Maps Pin */}
                            <a href="https://maps.google.com/?q=OM+Shiva+Towers+Fairlands+Salem" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', textDecoration: 'none', color: '#1a1a1a' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginTop: '2px', flexShrink: 0 }}>
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#EA4335"/>
                                </svg>
                                <span>IInd Floor, OM Shiva Towers, 259-B, Advaitha Ashram Rd, Fairlands, Salem, Tamil Nadu 636004</span>
                            </a>

                            {/* WhatsApp Phone */}
                            <a href="https://wa.me/918778476414" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#1a1a1a' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                </svg>
                                +91-8778476414
                            </a>

                            {/* Gmail */}
                            <a href="mailto:theventhulir@gmail.com" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#1a1a1a' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                                    <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.364l-6.545-4.636v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.273l6.545-4.636 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
                                    <path d="M0 5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.273l8.073-5.78C21.69 2.28 24 3.434 24 5.457L12 13.636 0 5.457z" fill="#EA4335" opacity="0.5"/>
                                </svg>
                                theventhulir@gmail.com
                            </a>

                        </div>

                        {/* Social Links with brand colors */}
                        <div style={{ display: 'flex', gap: '14px', marginTop: '20px', alignItems: 'center' }}>
                            <a href="https://www.instagram.com/theventhulir22?igsh=ODdyazhjc3NiNTh0" target="_blank" rel="noopener noreferrer" aria-label="Follow Venthulir on Instagram"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', boxShadow: '0 3px 10px rgba(220,39,67,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.12)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(220,39,67,0.5)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 3px 10px rgba(220,39,67,0.35)'; }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                                </svg>
                            </a>
                            <a href="https://www.linkedin.com/in/the-venthulir-2144333b4/" target="_blank" rel="noopener noreferrer" aria-label="Follow Venthulir on LinkedIn"
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '38px', height: '38px', borderRadius: '10px', background: '#0A66C2', boxShadow: '0 3px 10px rgba(10,102,194,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' }}
                                onMouseEnter={e => { e.currentTarget.style.transform='scale(1.12)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(10,102,194,0.5)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.boxShadow='0 3px 10px rgba(10,102,194,0.35)'; }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* MIDDLE: QUICK LINKS */}
                    <div className="footer-column" id="links">
                        <h3 className="royal-green-title">QUICK LINKS</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <a href="#" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '14px' }}>Shop Best Sellers</a>
                            <a href="#" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '14px' }}>Our Story</a>
                            <a href="#" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '14px' }}>Health Benefits</a>
                            <a href="#" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '14px' }}>Track Order</a>
                        </div>
                        
                        <h3 className="royal-green-title" style={{ marginTop: '30px', marginBottom: '15px' }}>POLICIES</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <a href="#" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '14px' }}>Privacy Policy</a>
                            <a href="#" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '14px' }}>Terms of Service</a>
                            <a href="#" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '14px' }}>Shipping & Returns</a>
                            <a href="#" style={{ color: '#1a1a1a', textDecoration: 'none', fontSize: '14px' }}>Refund Policy</a>
                        </div>
                    </div>

                    {/* RIGHT: GRIEVANCE FORM */}
                    <div className="footer-column" id="complaints">
                        <h3 className="royal-green-title">GRIEVANCE REGISTRY</h3>
                        {isSubmitted ? (
                            <div className="success-banner">Your grievance has been logged in the Royal Registry.</div>
                        ) : (
                            <form className="traditional-form" onSubmit={handleSubmit}>
                                <div className="form-split">
                                    <input
                                        type="text" placeholder="Name" required aria-label="Your Name"
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <input
                                        type="text" placeholder="Order #" required aria-label="Order ID"
                                        value={formData.orderId} onChange={e => setFormData({ ...formData, orderId: e.target.value })}
                                    />
                                </div>
                                <input
                                    type="email" placeholder="Email Address (for official reply)" required aria-label="Email Address"
                                    style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '10px' }}
                                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <label htmlFor="concern-select" style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}>Nature of Concern</label>
                                <select
                                    id="concern-select"
                                    required
                                    value={formData.concern} onChange={e => setFormData({ ...formData, concern: e.target.value })}
                                    style={{ marginBottom: '10px' }}
                                >
                                    <option value="">Nature of Concern</option>
                                    <option>Damaged Product</option>
                                    <option>Delivery Delay</option>
                                    <option>Quality Concern</option>
                                    <option>Other</option>
                                </select>
                                <textarea
                                    placeholder="Describe your concern here..." required aria-label="Message details"
                                    value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })}
                                ></textarea>
                                <button type="submit" className="royal-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'LOGGING...' : 'SUBMIT TO REGISTRY'} <Send size={14} />
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* CENTERED: CIRCULAR VENTHULIR ONLY */}
                <div className="circular-motion-container">
                    <div className="rotating-brand">
                        <svg viewBox="0 0 100 100">
                            <path id="circlePath" d="M 50, 50 m -40, 0 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" fill="transparent" />
                            <text fontSize="14" fontWeight="900" fill="#0a2e1f" letterSpacing="2">
                                <textPath xlinkHref="#circlePath">VENTHULIR • VENTHULIR • VENTHULIR • </textPath>
                            </text>
                        </svg>
                    </div>
                </div>

                <div className="footer-bottom-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <p style={{ margin: 0 }}>© 2026 VENTHULIR ORGANIC HARVEST. ROYALTY REFINED.</p>
                    <div style={{ display: 'flex', gap: '15px', color: '#0a2e1f' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}><ShieldCheck size={16}/> 100% SECURE CHECKOUT</span>
                        <CreditCard size={20} />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;