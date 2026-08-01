import React, { useEffect } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import { useAppNavigation } from '../context/NavigationContext';
import Navbar from './Navbar';
import Footer from './Footer';
import { ToastContainer } from 'react-toastify';
import NotificationSystem from './NotificationSystem';
import 'react-toastify/dist/ReactToastify.css';

const Layout = () => {
    const location = useLocation();
    const { currentView } = useAppNavigation();

    const pathname = location.pathname.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    const isHomePage = pathname === '/';
    const isStandaloneApp = pathname.startsWith('/admin') || pathname === '/auth';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    if (isStandaloneApp) {
        return (
            <div className="standalone-layout" style={{ minHeight: '100vh', background: '#f7f7f7' }}>
                <Outlet />
                <ToastContainer position="bottom-right" theme="dark" />
                <NotificationSystem />
            </div>
        );
    }

    const isDashboardPage = pathname.startsWith('/account') || currentView === 'profile';
    const shouldShowFooter = !isHomePage && !isDashboardPage;

    return (
        <div className={`App-root ${isHomePage ? 'home-layout' : 'standard-layout'}`}>
            {!isDashboardPage && <Navbar />}

            <main className="main-content-stage">
                <Outlet />
            </main>

            {shouldShowFooter && <Footer />}
            <ToastContainer position="bottom-right" theme="dark" />
            <NotificationSystem />
        </div>
    );
};


export default Layout;