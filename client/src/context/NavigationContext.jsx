import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const NavigationContext = createContext();

export const useAppNavigation = () => useContext(NavigationContext);

const normalizePath = (pathname) => pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';

const pathToView = (pathname) => {
    const path = normalizePath(pathname);

    if (path === '/' || path === '') return { view: 'home', params: {} };
    if (path === '/cart') return { view: 'cart', params: {} };
    if (path === '/wishlist') return { view: 'wishlist', params: {} };
    if (path === '/products' || path === '/all-products') return { view: 'all-products', params: {} };
    if (path.startsWith('/product/')) {
        const parts = path.split('/').filter(Boolean);
        const id = parts[1] || '';
        return { view: 'product', params: { id } };
    }
    if (path === '/journal') return { view: 'journal', params: {} };
    if (path === '/new-arrivals') return { view: 'new-arrivals', params: {} };
    if (path === '/checkout') return { view: 'checkout', params: {} };
    if (path === '/auth') return { view: 'auth', params: {} };
    if (path.startsWith('/account')) {
        const parts = path.split('/').filter(Boolean);
        const section = parts[1] || '';
        return { view: 'profile', params: section ? { section } : {} };
    }

    return { view: 'home', params: {} };
};

const viewToPath = (view, params = {}) => {
    switch (view) {
        case 'home':
            return '/';
        case 'cart':
            return '/cart';
        case 'wishlist':
            return '/wishlist';
        case 'all-products':
            return '/all-products';
        case 'journal':
            return '/journal';
        case 'new-arrivals':
            return '/new-arrivals';
        case 'checkout':
            return '/checkout';
        case 'auth':
            return '/auth';
        case 'profile':
            return params.section ? `/account/${params.section}` : '/account';
        case 'product':
            return params.id ? `/product/${params.id}` : '/';
        default:
            return '/';
    }
};

export const NavigationProvider = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const initialLocation = useMemo(() => pathToView(window.location.pathname), []);
    const [currentView, setCurrentView] = useState(initialLocation.view);
    const [viewParams, setViewParams] = useState(initialLocation.params);

    useEffect(() => {
        if (location.state && location.state.view) {
            setCurrentView(location.state.view);
            setViewParams(location.state.params || {});
        } else {
            const currentLocation = pathToView(location.pathname);
            setCurrentView(currentLocation.view);
            setViewParams(currentLocation.params);
        }
    }, [location.pathname, location.state]);

    const appNavigate = (view, params = {}, pushState = true) => {
        const path = viewToPath(view, params);
        try {
            window.scrollTo({ top: 0, behavior: 'auto' });
        } catch (err) {
            window.scrollTo(0, 0);
        }
        if (pushState) {
            navigate(path, { state: { view, params } });
        } else {
            navigate(path, { replace: true, state: { view, params } });
        }
    };

    return (
        <NavigationContext.Provider value={{ currentView, viewParams, appNavigate }}>
            {children}
        </NavigationContext.Provider>
    );
};
