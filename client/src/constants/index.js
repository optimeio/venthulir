export const APP_NAME = 'Venthulir Organic Harvest';
export const CATEGORIES = [
    'General',
    'Spices',
    'Essential Oils',
    'Health & Skin Care',
    'Wellness Products'
];

export const BADGES = [
    'Best Seller',
    'Authentic',
    'Pure',
    'Premium',
    'Organic',
    'New Arrival'
];

export const API_BASE = import.meta.env.PROD ? 'https://venthulir-1ehl.onrender.com/api' : (import.meta.env.VITE_API_URL || 'http://localhost:7000/api');
