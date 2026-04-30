import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://venthulir-1ehl.onrender.com/api' : 'http://localhost:7000/api');

const AdminApp = () => {
    const [adminUser, setAdminUser] = useState(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        const verifyStoredAdminSession = async () => {
            const token = localStorage.getItem('venthulir_admin_token') || localStorage.getItem('venthulir_token');
            if (!token) { setChecking(false); return; }

            try {
                const res = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const user = await res.json();
                    if (user.isAdmin) {
                        setAdminUser(user);
                    } else {
                        localStorage.removeItem('venthulir_admin_token');
                    }
                } else {
                    localStorage.removeItem('venthulir_admin_token');
                }
            } catch {
                // Network error — don't grant access
            }
            setChecking(false);
        };
        verifyStoredAdminSession();
    }, []);

    const handleAdminLogin = (user, token) => {
        localStorage.setItem('venthulir_admin_token', token);
        setAdminUser(user);
    };

    const handleAdminLogout = () => {
        localStorage.removeItem('venthulir_admin_token');
        setAdminUser(null);
    };

    if (checking) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0b3d2e', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', border: '4px solid rgba(212,175,55,0.3)', borderTop: '4px solid #d4af37', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: '#d4af37', fontFamily: 'sans-serif', fontWeight: 'bold' }}>Verifying Identity...</p>
            </div>
        );
    }

    if (!adminUser || !adminUser.isAdmin) {
        return <AdminLoginPage onLoginSuccess={handleAdminLogin} />;
    }

    return <AdminPage onLogout={handleAdminLogout} />;
};

ReactDOM.createRoot(document.getElementById('admin-root')).render(
    <React.StrictMode>
        <AdminApp />
    </React.StrictMode>
);
