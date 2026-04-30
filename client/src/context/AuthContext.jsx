import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const API_URL = import.meta.env.PROD ? 'https://venthulir-1ehl.onrender.com/api' : (import.meta.env.VITE_API_URL || 'http://localhost:7000/api');

    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('venthulir_token');
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                // Always verify the token with the server on startup — prevents stale/tampered sessions
                const response = await fetch(`${API_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const serverUser = await response.json();
                    // Merge server data (isAdmin from DB) with any cached data
                    const freshUser = {
                        id: serverUser._id,
                        name: serverUser.name,
                        email: serverUser.email,
                        phone: serverUser.phone,
                        isAdmin: serverUser.isAdmin,
                        deliveryAddress: serverUser.deliveryAddress
                    };
                    setUser(freshUser);
                    setIsAuthenticated(true);
                    localStorage.setItem('venthulir_user', JSON.stringify(freshUser));
                } else {
                    // Token is invalid or expired — clear all stored auth data
                    localStorage.removeItem('venthulir_token');
                    localStorage.removeItem('venthulir_user');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            } catch {
                // Network error — fall back to cached session (server might be down)
                const savedUser = localStorage.getItem('venthulir_user');
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                    setIsAuthenticated(true);
                }
            }
            setLoading(false);
        };
        verifySession();
    }, []);

    const login = async (email, password, rememberMe = false) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, rememberMe })
            });

            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('venthulir_token', data.token);
                localStorage.setItem('venthulir_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, msg: data.msg || 'Login failed' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };

    const register = async (name, email, phone, password, address, city, state, zipCode, otp) => {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, password, address, city, state, zipCode, otp })
            });

            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('venthulir_token', data.token);
                localStorage.setItem('venthulir_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, msg: data.msg || 'Registration failed' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };

    const requestOTP = async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, msg: data.msg };
            } else {
                return { success: false, msg: data.msg || 'Verification request failed' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };

    const requestRegisterOTP = async (email) => {
        try {
            const response = await fetch(`${API_URL}/auth/send-register-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, msg: data.msg };
            } else {
                return { success: false, msg: data.msg || 'Verification request failed' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };

    const verifyRegisterOTP = async (email, otp) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-register-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, msg: data.msg };
            } else {
                return { success: false, msg: data.msg || 'Verification failed' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };
    const verifyOTP = async (email, otp, rememberMe = false) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, rememberMe })
            });
            const data = await response.json();
            if (response.ok) {
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('venthulir_token', data.token);
                localStorage.setItem('venthulir_user', JSON.stringify(data.user));
                return { success: true };
            } else {
                return { success: false, msg: data.msg || 'Invalid verification code' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };

    const forgotPassword = async (email) => {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, msg: data.msg };
            } else {
                return { success: false, msg: data.msg || 'Request failed' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };

    const verifyResetOTP = async (email, otp) => {
        try {
            const response = await fetch(`${API_URL}/auth/verify-reset-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, msg: data.msg };
            } else {
                return { success: false, msg: data.msg || 'Verification failed' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };

    const resetPassword = async (email, newPassword) => {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, msg: data.msg };
            } else {
                return { success: false, msg: data.msg || 'Reset failed' };
            }
        } catch (err) {
            return { success: false, msg: 'Server connection failed' };
        }
    };

    const updateUser = (updatedUserData) => {
        setUser(updatedUserData);
        localStorage.setItem('venthulir_user', JSON.stringify(updatedUserData));
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem('venthulir_user');
        localStorage.removeItem('venthulir_token');
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, register, requestOTP, requestRegisterOTP, verifyOTP, verifyRegisterOTP, verifyResetOTP, logout, loading, updateUser, forgotPassword, resetPassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);

