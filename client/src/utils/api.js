import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://venthulir-1ehl.onrender.com/api' : 'http://localhost:7000/api');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor for JWT
api.interceptors.request.use(config => {
    const token = localStorage.getItem('venthulir_token');
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
};

export const paymentAPI = {
    createOrder: (amount) => api.post('/payment/order', { amount }),
    verifyPayment: (paymentData) => api.post('/payment/verify', paymentData),
};

export default api;
