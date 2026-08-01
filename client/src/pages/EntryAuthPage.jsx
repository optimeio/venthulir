import React, { useState, useEffect } from 'react';
import { useAppNavigation } from '../context/NavigationContext';
import { Eye, EyeOff, ChevronRight, ChevronDown, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './EntryAuthPage.css';

const EntryAuthPage = ({ onLoginSuccess, redirectView, redirectParams }) => {
    const { isAuthenticated, login, register, requestRegisterOTP, verifyRegisterOTP, verifyResetOTP, forgotPassword, resetPassword } = useAuth();
    const { appNavigate } = useAppNavigation();

    const [view, setView] = useState('login');
    const [sunActive, setSunActive] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', otp: '' });
    const [isVerifying, setIsVerifying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(60);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isForgotVerified, setIsForgotVerified] = useState(false);
    const [isRegisterOtpMode, setIsRegisterOtpMode] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotStep, setForgotStep] = useState(1);
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [otpExpiry, setOtpExpiry] = useState(null);

    useEffect(() => {
        const savedExpiry = sessionStorage.getItem('venthulir_otp_expiry');
        if (savedExpiry) {
            const expiry = parseInt(savedExpiry);
            if (expiry > Date.now()) {
                setOtpExpiry(expiry);
                if (showForgotPassword) setForgotStep(2);
                else setIsRegisterOtpMode(true);
            }
        }
    }, [showForgotPassword]);

    useEffect(() => {
        if (!otpExpiry) return;

        const updateTimer = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.ceil((otpExpiry - now) / 1000));
            setTimeLeft(remaining);

            if (remaining === 0) {
                setError("OTP has expired. Please use the resend button.");
                setOtpExpiry(null);
                sessionStorage.removeItem('venthulir_otp_expiry');
            }
        };

        updateTimer();
        const id = setInterval(updateTimer, 1000);
        return () => clearInterval(id);
    }, [otpExpiry]);

    useEffect(() => {
        const handlePopState = (event) => {
            if (event.state && event.state.authView) {
                setView(event.state.authView);
            }
        };
        window.addEventListener('popstate', handlePopState);

        // Initial landing state if not already set
        if (!window.history.state || !window.history.state.authView) {
            window.history.replaceState({ ...window.history.state, authView: view }, '', '');
        }

        setTimeout(() => setSunActive(true), 100);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const setAuthView = (newView) => {
        setView(newView);
        window.history.pushState({ ...window.history.state, authView: newView }, '', '');
    };

    const handleSendRegisterOtp = async () => {
        if (!formData.email) {
            setError('Please enter your email to verify.');
            return;
        }
        setError('');
        setIsVerifying(true);
        const reqRes = await requestRegisterOTP(formData.email);
        setIsVerifying(false);
        if (reqRes.success) {
            const expiry = Date.now() + 60000;
            setOtpExpiry(expiry);
            sessionStorage.setItem('venthulir_otp_expiry', expiry.toString());
            setIsRegisterOtpMode(true);
            setError('');
        } else {
            setError(reqRes.msg);
        }
    };

    const handleVerifyRegisterOtp = async () => {
        if (!formData.otp) {
            setError('Please enter verification code.');
            return;
        }
        if (timeLeft <= 0) {
            setError('Verification code has expired. Please resend.');
            return;
        }
        setError('');
        setIsVerifying(true);
        const res = await verifyRegisterOTP(formData.email, formData.otp);
        setIsVerifying(false);
        if (res.success) {
            setIsEmailVerified(true);
            setIsRegisterOtpMode(false);
            setOtpExpiry(null);
            sessionStorage.removeItem('venthulir_otp_expiry');
        } else {
            alert(res.msg);
        }
    };

    const handleVerifyResetOtp = async () => {
        if (!formData.otp) {
            setError('Please enter verification code.');
            return;
        }
        if (timeLeft <= 0) {
            setError('Verification code has expired. Please resend.');
            return;
        }
        setError('');
        setIsVerifying(true);
        const res = await verifyResetOTP(formData.email, formData.otp);
        setIsVerifying(false);
        if (res.success) {
            setIsForgotVerified(true);
            setForgotStep(3); // Move to password entry
            setOtpExpiry(null);
            sessionStorage.removeItem('venthulir_otp_expiry');
            setError('');
        } else {
            alert(res.msg);
        }
    };

    const handleForgotPasswordFlow = async (e) => {
        e.preventDefault();
        setError('');
        if (forgotStep === 1) {
            setIsVerifying(true);
            const res = await forgotPassword(formData.email);
            setIsVerifying(false);
            if (res.success) {
                const expiry = Date.now() + 60000;
                setOtpExpiry(expiry);
                sessionStorage.setItem('venthulir_otp_expiry', expiry.toString());
                setForgotStep(2);
                setIsForgotVerified(false);
            } else {
                alert(res.msg);
            }
        } else if (forgotStep === 2) {
            handleVerifyResetOtp();
        } else if (forgotStep === 3) {
            setIsVerifying(true);
            const res = await resetPassword(formData.email, formData.password);
            setIsVerifying(false);
            if (res.success) {
                setForgotStep(1);
                setIsForgotVerified(false);
                setShowForgotPassword(false);
                setView('login');
                alert(res.msg);
            } else {
                alert(res.msg);
            }
        }
    };

    const handleResendResetOTP = async () => {
        setError('');
        setIsVerifying(true);
        const res = await forgotPassword(formData.email);
        setIsVerifying(false);
        if (res.success) {
            const expiry = Date.now() + 60000;
            setOtpExpiry(expiry);
            sessionStorage.setItem('venthulir_otp_expiry', expiry.toString());
            setError('');
        } else {
            setError(res.msg);
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (view === 'login') {
            setIsVerifying(true);
            const result = await login(formData.email, formData.password, rememberMe);
            setIsVerifying(false);
            if (result.success) {
                if (onLoginSuccess) onLoginSuccess();
                if (formData.email === 'thesmgroups@gmail.com') {
                    window.location.href = '/admin';
                    return;
                }
                if (redirectView) {
                    appNavigate(redirectView, redirectParams);
                } else {
                    appNavigate('home');
                }
            } else {
                setError(result.msg);
            }
        } else if (view === 'register') {
            if (!isEmailVerified) {
                setError('Please verify your email first.');
                return;
            }
            const phoneDigits = formData.phone.replace(/[\s\-\(\)\+]/g, '');
            if (!/^\d{10}$/.test(phoneDigits)) {
                setError('Please enter a valid 10-digit mobile number.');
                return;
            }
            setIsVerifying(true);
            const result = await register(formData.name, formData.email, formData.phone, formData.password, '', '', '', '', '');
            setIsVerifying(false);
            if (result.success) {
                if (onLoginSuccess) onLoginSuccess();
                if (formData.email === 'thesmgroups@gmail.com') {
                    window.location.href = '/admin';
                    return;
                }
                if (redirectView) {
                    appNavigate(redirectView, redirectParams);
                } else {
                    appNavigate('home');
                }
            } else {
                setError(result.msg);
            }
        }
    };

    return (
        <div className="vent-auth-viewport">
            {/* Ambient SEO/Performance Layer */}
            <div className="environment-layer">
                <div className={`ethereal-sun ${sunActive ? 'rise-up' : ''}`}></div>
                <div className="silhouette tree-l"></div>
                <div className="silhouette tree-r"></div>
            </div>

            <div className="content-stack fade-in">
                <div className="a-auth-logo" role="button" tabIndex="0" onClick={() => appNavigate('home')} style={{ cursor: 'pointer' }} onKeyDown={(e) => { if (e.key === 'Enter') appNavigate('home'); }}>
                    VENTHULIR
                </div>

                <div className="interactive-portal">
                    {view === 'landing' ? (
                        <div className="fade-in-up">
                            <p className="tagline">Organic Essence • Royal Quality</p>
                            <div className="oval-button-group">
                                <button type="button" className="oval-btn btn-fill" onClick={() => { setAuthView('login'); setError(''); }}>Sign In</button>
                                <button type="button" className="oval-btn btn-outline" onClick={() => { setAuthView('register'); setIsEmailVerified(false); setError(''); }}>New Customer</button>
                            </div>
                        </div>
                    ) : (
                        <div className="amazon-auth-card fade-in-scale">
                            <button type="button" className="back-x" aria-label="Close authentication" onClick={() => appNavigate('home')}>✕</button>

                            <div className="card-inner">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                                    <button
                                        type="button"
                                        aria-label="Navigate back"
                                        onClick={() => appNavigate('home')}
                                        style={{ background: 'none', border: 'none', color: '#0a2e1f', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center' }}
                                    >
                                        <ArrowLeft size={24} />
                                    </button>
                                    <h1 style={{ margin: 0, color: '#0a2e1f', fontSize: '24px' }}>
                                        {showForgotPassword ? 'Reset Password' : (view === 'login' ? 'Sign In' : 'Sign Up')}
                                    </h1>
                                </div>

                                {error && (
                                    <div className="a-auth-error-alert" role="alert">
                                        <AlertCircle size={18} className="a-alert-icon" />
                                        <div className="a-alert-content">
                                            <h4>There was a problem</h4>
                                            <p>{error}</p>
                                        </div>
                                    </div>
                                )}

                                <form className="auth-form" onSubmit={showForgotPassword ? handleForgotPasswordFlow : handleAuthSubmit}>
                                    {showForgotPassword ? (
                                        <div className="forgot-password-flow">
                                            {forgotStep === 1 ? (
                                                <div className="input-wrap">
                                                    <label htmlFor="reset-email">Email Address</label>
                                                    <input id="reset-email" required type="email" placeholder="Enter registered email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                                </div>
                                            ) : forgotStep === 2 ? (
                                                <div className="otp-box-standard">
                                                    <label htmlFor="reset-otp">Enter Verification Code</label>
                                                    <div className="a-verify-group">
                                                        <input id="reset-otp" required type="text" placeholder="000000" maxLength="6" value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })} style={{ letterSpacing: '4px', textAlign: 'center' }} />
                                                        <button type="button" onClick={handleVerifyResetOtp} disabled={isVerifying || timeLeft <= 0} className="a-button-verify-inline">
                                                            {isVerifying ? '...' : 'Validate'}
                                                        </button>
                                                    </div>

                                                    <div className="timer-resend-row">
                                                        <span className="timer" style={{ color: timeLeft <= 10 ? '#c40000' : '#0a2e1f' }}>
                                                            {timeLeft > 0 ? `${timeLeft}s` : 'Expired'}
                                                        </span>
                                                        <button type="button" onClick={handleResendResetOTP} className="resend-btn">Resend OTP?</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="password-reset-entry">
                                                    <div className="input-wrap">
                                                        <label htmlFor="new-password">New Password</label>
                                                        <div className="a-password-input-wrapper">
                                                            <input id="new-password" required type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                                            <button type="button" className="a-password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            {forgotStep !== 2 && (
                                                <button type="submit" disabled={isVerifying} className="royal-submit-action">
                                                    {isVerifying ? 'Processing...' : (forgotStep === 1 ? 'Send Reset OTP' : 'Update Password')}
                                                </button>
                                            )}
                                            <button type="button" onClick={() => { setShowForgotPassword(false); setForgotStep(1); setIsForgotVerified(false); }} style={{ background: 'none', border: 'none', color: '#0a2e1f', marginTop: '15px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', width: '100%', textAlign: 'center' }}>Back to Sign In</button>
                                        </div>
                                    ) : (
                                        view === 'register' ? (
                                            <div className="registration-flow">
                                                <div className="input-wrap">
                                                    <label htmlFor="reg-name">Your Name</label>
                                                    <input id="reg-name" required type="text" placeholder="First and last name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                                </div>
                                                <div className="input-wrap">
                                                    <label htmlFor="reg-email">Email Address</label>
                                                    <div className="a-verify-group">
                                                        <input id="reg-email" required type="email" placeholder="Enter email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} disabled={isEmailVerified} />
                                                        {!isEmailVerified && !isRegisterOtpMode && (
                                                            <button type="button" onClick={handleSendRegisterOtp} disabled={isVerifying || !formData.email} className="a-button-verify-inline">Verify</button>
                                                        )}
                                                        {isEmailVerified && <span style={{ color: '#008a00', fontSize: '12px', fontWeight: 'bold', minWidth: '75px', textAlign: 'right' }}>✓ Verified</span>}
                                                    </div>
                                                </div>
                                                {isRegisterOtpMode && !isEmailVerified && (
                                                    <div className="otp-box-standard">
                                                        <label htmlFor="reg-otp">Enter Verification Code</label>
                                                        <div className="a-verify-group">
                                                            <input id="reg-otp" type="text" placeholder="000000" maxLength="6" value={formData.otp} onChange={e => setFormData({ ...formData, otp: e.target.value })} required style={{ letterSpacing: '4px', textAlign: 'center' }} />
                                                            <button type="button" onClick={handleVerifyRegisterOtp} disabled={isVerifying || timeLeft <= 0} className="a-button-verify-inline">
                                                                {isVerifying ? '...' : 'Validate'}
                                                            </button>
                                                        </div>
                                                        <div className="timer-resend-row">
                                                            <span className="timer" style={{ color: timeLeft <= 10 ? '#c40000' : '#0a2e1f' }}>{timeLeft > 0 ? `${timeLeft}s` : 'Expired'}</span>
                                                            <button type="button" onClick={handleSendRegisterOtp} className="resend-btn">Resend OTP?</button>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="input-wrap">
                                                    <label htmlFor="reg-phone">Mobile phone number</label>
                                                    <input id="reg-phone" required type="tel" placeholder="10-digit number" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                                </div>
                                                <div className="input-wrap">
                                                    <label htmlFor="reg-password">Password</label>
                                                    <div className="a-password-input-wrapper">
                                                        <input id="reg-password" required type={showPassword ? "text" : "password"} placeholder="At least 6 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                                        <button type="button" className="a-password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                                    </div>
                                                </div>
                                                <button type="submit" disabled={isVerifying || !isEmailVerified} className="royal-submit-action">{isVerifying ? 'Processing...' : 'Create Account'}</button>
                                            </div>
                                        ) : (
                                            <div className="login-flow">
                                                <div className="input-wrap">
                                                    <label htmlFor="login-email">Email Address</label>
                                                    <input id="login-email" required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                                                </div>
                                                <div className="input-wrap">
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <label htmlFor="login-password-main">Password</label>
                                                        <button type="button" onClick={() => { setShowForgotPassword(true); setError(''); }} style={{ background: 'none', border: 'none', color: '#0a2e1f', fontSize: '12px', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>Forgot password?</button>
                                                    </div>
                                                    <div className="a-password-input-wrapper">
                                                        <input id="login-password-main" required type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                                        <button type="button" className="a-password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                                    </div>
                                                </div>
                                                <div className="remember-me-wrapper">
                                                    <input type="checkbox" id="rem-page" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                                                    <label htmlFor="rem-page">Keep me signed in</label>
                                                </div>
                                                <button type="submit" disabled={isVerifying} className="royal-submit-action">{isVerifying ? 'Processing...' : 'Sign In'}</button>
                                            </div>
                                        )
                                    )}
                                </form>

                                <div className="a-auth-card-footer" style={{ borderTop: '1px solid #f1f5f9', marginTop: '25px', paddingTop: '25px' }}>
                                    <p className="legal-msg" style={{ border: 'none', padding: 0, margin: 0 }}>
                                        By continuing, you agree to Venthulir's <span>Conditions of Use</span> and <span>Privacy Notice</span>.
                                    </p>

                                    {!showForgotPassword && (
                                        <div className="a-auth-help-section">
                                            <div className="a-help-trigger" onClick={() => setIsHelpOpen(!isHelpOpen)}>
                                                {isHelpOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                <span>Need help?</span>
                                            </div>
                                            {isHelpOpen && (
                                                <div className="a-help-dropdown">
                                                    <span onClick={() => { setShowForgotPassword(true); setIsHelpOpen(false); setError(''); }}>Forgot Password</span>
                                                    <a href="#issues">Other issues with Sign-In</a>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {!showForgotPassword && view !== 'landing' && (
                        <div className="switch-footer">
                            {view === 'login' ? (
                                <>
                                    <div className="divider-line">
                                        <span>New to Venthulir?</span>
                                    </div>
                                    <button className="toggle-btn" onClick={() => { setAuthView('register'); setIsEmailVerified(false); }}>
                                        Create your Venthulir account
                                    </button>
                                </>
                            ) : (
                                <div className="a-auth-switch-link" style={{ marginTop: '20px' }}>
                                    Already have an account? <span onClick={() => setAuthView('login')} style={{ color: '#0a2e1f', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline', marginLeft: '5px' }}>Sign in</span>
                                </div>
                            )}
                        </div>
                    )}

                    {view !== 'landing' && (
                        <button type="button" className="a-cancel-return-btn" onClick={() => appNavigate('home')}>
                            CANCEL AND RETURN TO HOME
                        </button>
                    )}
                </div>
            </div>
            <div style={{ position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)', opacity: 0.2, color: '#0a2e1f', fontSize: '10px', letterSpacing: '5px', pointerEvents: 'none' }}>EST. 2026</div>
            <style>{`
                .fade-in { animation: fadeIn 0.5s ease forwards; }
                .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
                .fade-in-scale { animation: fadeInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInScale { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
            `}</style>
        </div>
    );
};

export default EntryAuthPage;
