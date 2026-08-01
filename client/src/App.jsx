import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import AccountLayout from './components/AccountLayout';
import CustomerApp from './pages/CustomerApp';
import CustomerPage from './pages/CustomerPage';
import { NavigationProvider } from './context/NavigationContext';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <NavigationProvider>
              <Routes>
                <Route element={<Layout />}>
                  <Route index element={<CustomerApp />} />
                  <Route path="products" element={<CustomerApp />} />
                  <Route path="product/:id" element={<CustomerApp />} />
                  <Route path="cart" element={<CustomerApp />} />
                  <Route path="wishlist" element={<CustomerApp />} />
                  <Route path="new-arrivals" element={<CustomerApp />} />
                  <Route path="journal" element={<CustomerApp />} />
                  <Route path="checkout" element={<CustomerApp />} />
                  <Route path="auth" element={<CustomerApp />} />
                  <Route path="account/*" element={<AccountLayout />}>
                    <Route index element={<CustomerPage />} />
                    <Route path="orders" element={<CustomerPage />} />
                    <Route path="wishlist" element={<CustomerPage />} />
                    <Route path="cart" element={<CustomerPage />} />
                    <Route path="rewards" element={<CustomerPage />} />
                    <Route path="support" element={<CustomerPage />} />
                    <Route path="profile" element={<CustomerPage />} />
                  </Route>
                  <Route path="*" element={<CustomerApp />} />
                </Route>
              </Routes>
            </NavigationProvider>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;