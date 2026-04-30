import React, { useState } from 'react';
import logo from '../assets/organic.png';
import { Lock, Mail, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

const AdminLoginPage = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://venthulir-1ehl.onrender.com/api' : 'http://localhost:7000/api');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.msg || 'Invalid credentials.');
                setLoading(false);
                return;
            }

            if (!data.user?.isAdmin) {
                setError('Access Denied. This portal is for authorized personnel only.');
                setLoading(false);
                return;
            }

            localStorage.setItem('venthulir_admin_token', data.token);
            localStorage.setItem('venthulir_admin_user', JSON.stringify(data.user));
            onLoginSuccess(data.user, data.token);

        } catch {
            setError('Server connection failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-root">
            <div className="bg-decor" aria-hidden="true" />
            
            <div className="admin-login-card fade-in-scale">
                <div className="card-header">
                    <div className="lock-icon-outer" aria-hidden="true">
                        <div className="lock-icon-inner">
                            <Lock size={28} />
                        </div>
                    </div>
                    
                    <img src={logo} alt="Venthulir Organic Harvest" className="admin-logo" />
                    
                    <div className="header-titles">
                        <h1>Royal Admin Portal</h1>
                        <p>Restricted Access — Authorized Personnel Only</p>
                    </div>
                </div>

                {error && (
                    <div className="error-alert fade-in" role="alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="admin-login-form">
                    <div className="input-group">
                        <label htmlFor="admin-email">Admin Email</label>
                        <div className="input-wrapper">
                            <Mail size={18} className="input-icon" aria-hidden="true" />
                            <input
                                id="admin-email"
                                type="email"
                                required
                                autoComplete="username"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter admin email"
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="admin-password">Password</label>
                        <div className="input-wrapper">
                            <Lock size={18} className="input-icon" aria-hidden="true" />
                            <input
                                id="admin-password"
                                type="password"
                                required
                                autoComplete="current-password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter admin password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`submit-btn ${loading ? 'loading' : ''}`}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="spin" aria-hidden="true" />
                                <span>Verifying Account...</span>
                            </>
                        ) : (
                            <>
                                <span>Access Admin Panel</span>
                                <ChevronRight size={18} aria-hidden="true" />
                            </>
                        )}
                    </button>
                </form>

                <footer className="admin-login-footer">
                    <p>© Venthulir Royal Reserves — Secure Portal</p>
                </footer>
            </div>

            <style>{`
                .admin-login-root {
                    min-height: 100vh;
                    background: radial-gradient(circle at center, #0b3d2e 0%, #071e12 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 24px;
                    font-family: 'Outfit', 'Inter', sans-serif;
                    position: relative;
                    overflow: hidden;
                }

                .bg-decor {
                    position: fixed;
                    inset: 0;
                    background-image: 
                        radial-gradient(circle at 15% 15%, rgba(212, 175, 55, 0.08) 0%, transparent 40%),
                        radial-gradient(circle at 85% 85%, rgba(212, 175, 55, 0.08) 0%, transparent 40%);
                    pointer-events: none;
                }

                .admin-login-card {
                    width: 100%;
                    maxWidth: 440px;
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(24px);
                    -webkit-backdrop-filter: blur(24px);
                    border: 1px solid rgba(212, 175, 55, 0.2);
                    border-radius: 28px;
                    padding: 50px 40px;
                    box-shadow: 
                        0 30px 60px rgba(0, 0, 0, 0.4),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.05);
                    position: relative;
                    z-index: 2;
                }

                .card-header {
                    text-align: center;
                    margin-bottom: 35px;
                }

                .lock-icon-outer {
                    width: 72px;
                    height: 72px;
                    background: linear-gradient(135deg, rgba(212, 175, 55, 0.2), rgba(212, 175, 55, 0.05));
                    border: 1px solid rgba(212, 175, 55, 0.3);
                    border-radius: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 24px;
                    transform: rotate(-5deg);
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
                }

                .lock-icon-inner {
                    color: #d4af37;
                    filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
                }

                .admin-logo {
                    height: 42px;
                    object-fit: contain;
                    display: block;
                    margin: 0 auto 16px;
                    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
                }

                .header-titles h1 {
                    color: #d4af37;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 4px;
                    text-transform: uppercase;
                    margin: 0 0 8px;
                }

                .header-titles p {
                    color: rgba(255, 255, 255, 0.45);
                    font-size: 13px;
                    margin: 0;
                    letter-spacing: 0.5px;
                }

                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.25);
                    border-radius: 12px;
                    padding: 14px 18px;
                    margin-bottom: 25px;
                    color: #fca5a5;
                    font-size: 13.5px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    line-height: 1.4;
                }

                .admin-login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 22px;
                }

                .input-group label {
                    display: block;
                    font-size: 12px;
                    font-weight: 700;
                    color: rgba(255, 255, 255, 0.5);
                    letter-spacing: 1.5px;
                    text-transform: uppercase;
                    margin-bottom: 10px;
                }

                .input-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }

                .input-icon {
                    position: absolute;
                    left: 16px;
                    color: rgba(212, 175, 55, 0.4);
                    transition: color 0.3s ease;
                    pointer-events: none;
                }

                .input-wrapper input {
                    width: 100%;
                    padding: 15px 16px 15px 48px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1.5px solid rgba(212, 175, 55, 0.15);
                    border-radius: 14px;
                    color: #fff;
                    font-size: 15px;
                    outline: none;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-sizing: border-box;
                }

                .input-wrapper input:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(212, 175, 55, 0.6);
                    box-shadow: 0 0 20px rgba(212, 175, 55, 0.1);
                }

                .input-wrapper input:focus + .input-icon {
                    color: #d4af37;
                }

                .submit-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
                    color: #0b3d2e;
                    border: none;
                    border-radius: 14px;
                    font-weight: 800;
                    font-size: 15px;
                    cursor: pointer;
                    letter-spacing: 0.5px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 12px;
                    margin-top: 8px;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 8px 30px rgba(184, 134, 11, 0.3);
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(184, 134, 11, 0.4);
                    background: linear-gradient(135deg, #e5c04c 0%, #c69b12 100%);
                }

                .submit-btn:active:not(:disabled) {
                    transform: translateY(0);
                }

                .submit-btn:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .admin-login-footer {
                    text-align: center;
                    margin-top: 40px;
                }

                .admin-login-footer p {
                    color: rgba(255, 255, 255, 0.25);
                    font-size: 12px;
                    margin: 0;
                    letter-spacing: 1px;
                }

                /* Animations */
                .fade-in {
                    animation: fadeIn 0.5s ease forwards;
                }

                .fade-in-scale {
                    animation: fadeInScale 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }

                .spin {
                    animation: spin 1s linear infinite;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.94) translateY(20px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                @media (max-width: 480px) {
                    .admin-login-card {
                        padding: 40px 24px;
                        border-radius: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default AdminLoginPage;
