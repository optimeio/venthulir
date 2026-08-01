import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, Package, Users, ShoppingCart,
    Plus, ShieldQuestion, Send,
    LogOut, Trash2, Edit2, Activity,
    Loader2, ChevronRight, Search, Download, Trash, Tag, FileText
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import AdminLayout from '../layouts/AdminLayout';
import InvoiceModal from '../components/InvoiceModal';
import { api } from '../services/api';
import { API_BASE } from '../constants';

function AdminPage({ onLogout }) {
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [stats, setStats] = useState({ productCount: 0, userCount: 0, orderCount: 0, messageCount: 0, lowStockCount: 0, outOfStockCount: 0 });
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [coupons, setCoupons] = useState([]);
    const [inventory, setInventory] = useState({ totalProducts: 0, totalStock: 0, lowStockProducts: [], outOfStockProducts: [], allProducts: [] });
    const [restockInputs, setRestockInputs] = useState({});
    const [offerRestockInputs, setOfferRestockInputs] = useState({});
    const [prodForm, setProdForm] = useState({ productCode: '', name: '', price: '', description: '', category: 'General', badge: '', shippingCharge: 0, initialStock: '', originalPrice: '', discountPercent: '', hsnSac: '' });
    const [couponForm, setCouponForm] = useState({ couponCode: '', productId: '', maxUses: 25, expiryDate: '', discountPercentage: 10, status: 'Active' });
    const [isEditingCoupon, setIsEditingCoupon] = useState(false);
    const [editingCouponId, setEditingCouponId] = useState(null);
    const [orderStartDate, setOrderStartDate] = useState('');
    const [orderEndDate, setOrderEndDate] = useState('');
    const [variants, setVariants] = useState([]);
    const [variantInput, setVariantInput] = useState({ label: '', price: '', contents: '' });
    const [comboContents, setComboContents] = useState([]);
    const [comboInput, setComboInput] = useState({ item: '', weight: '' });
    const [showCustomUnit, setShowCustomUnit] = useState(false);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [replyTexts, setReplyTexts] = useState({});
    const [isResolving, setIsResolving] = useState({});
    const [selectedOrderInvoice, setSelectedOrderInvoice] = useState(null);

    // ── Offers State ────────────────────────────────────
    const [offers, setOffers] = useState([]);
    const [offerForm, setOfferForm] = useState({
        name: '', description: '', imageUrl: '', price: '',
        offerPrice: '', mrpIllusion: '', discountPercent: '',
        category: 'General', badge: 'Limited Offer',
        stock: '', rating: '', condition: 'First 60 customers only allowed',
        comboContents: '', startDate: '', endDate: ''
    });
    const [offerPreviewUrls, setOfferPreviewUrls] = useState([]);
    const [isEditingOffer, setIsEditingOffer] = useState(false);
    const [editingOfferId, setEditingOfferId] = useState(null);
    const [isOfferUploading, setIsOfferUploading] = useState(false);

    useEffect(() => {
        fetchData();

        // Real-time polling every 5s
        let interval;
        if (activeTab === 'Orders' || activeTab === 'Dashboard' || activeTab === 'Inventory') {
            interval = setInterval(() => {
                fetchData();
            }, 5000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeTab]);

    const fetchData = async () => {
        // Each tab's fetch is isolated — failure in one won't break others
        try {
            if (activeTab === 'Dashboard') {
                const s = await api.get('/admin/stats');
                setStats(s);
            }

        } catch (err) { console.error('Stats fetch error:', err); }

        try {
            if (activeTab === 'Users') setUsers(await api.get('/admin/users'));
        } catch (err) { console.error('Users fetch error:', err); }

        try {
            if (activeTab === 'Orders') setOrders(await api.get('/admin/orders'));
        } catch (err) { console.error('Orders fetch error:', err); }

        try {
            if (activeTab === 'Queries') {
                const msgs = await api.get('/admin/messages');
                setMessages(Array.isArray(msgs) ? msgs : []);
            }
        } catch (err) { console.error('Messages fetch error:', err); }

        try {
            if (activeTab === 'All Products') {
                const prodList = await api.get('/admin/products');
                setProducts(prodList);
            }
        } catch (err) { console.error('Products fetch error:', err); }

        try {
            if (activeTab === 'Inventory') {
                const inv = await api.get('/admin/inventory');
                setInventory(inv);
            }
        } catch (err) { console.error('Inventory fetch error:', err); }

        try {
            if (activeTab === 'Activity') {
                const logs = await api.get('/admin/logs');
                setActivityLogs(logs);
            }
        } catch (err) { console.error('Activity fetch error:', err); }

        try {
            if (activeTab === 'Coupons') {
                const fetchedCoupons = await api.get('/coupons');
                setCoupons(Array.isArray(fetchedCoupons) ? fetchedCoupons : []);
                if (products.length === 0) {
                    const fetchedProducts = await api.get('/admin/products');
                    setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
                }
            }
        } catch (err) { console.error('Coupons fetch error:', err); }

        try {
            if (activeTab === 'Offers') {
                const fetchedOffers = await api.get('/offers');
                setOffers(Array.isArray(fetchedOffers) ? fetchedOffers : []);
            }
        } catch (err) { console.error('Offers fetch error:', err); }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
            fetchData();
        } catch (err) {
            alert('Failed to update status: ' + (err.message || 'Unknown error'));
        }
    };

    const handleRestock = async (productId) => {
        const qty = parseInt(restockInputs[productId] || 0);
        if (!qty || qty <= 0) return alert('Enter a valid quantity.');
        try {
            await api.put(`/admin/inventory/${productId}/restock`, { quantity: qty });
            setRestockInputs(prev => ({ ...prev, [productId]: '' }));
            fetchData();
        } catch (err) {
            alert('Restock failed: ' + err.message);
        }
    };

    const handleRestockOffer = async (offerId) => {
        const qty = parseInt(offerRestockInputs[offerId] || 0);
        if (!qty || qty <= 0) return alert('Enter a valid quantity.');
        try {
            await api.put(`/admin/inventory/offers/${offerId}/restock`, { quantity: qty });
            setOfferRestockInputs(prev => ({ ...prev, [offerId]: '' }));
            fetchData();
        } catch (err) {
            alert('Offer restock failed: ' + err.message);
        }
    };

    const handleAddVariant = () => {
        if (!variantInput.label.trim()) {
            alert("Please select or enter a measurement unit (e.g. 100g)");
            return;
        }

        const finalPrice = variantInput.price || prodForm.price;
        if (!finalPrice) {
            alert("Please provide a price for this variant or set a Base Price first.");
            return;
        }

        setVariants([...variants, {
            label: variantInput.label,
            price: parseFloat(finalPrice),
            contents: variantInput.contents.trim() || ''
        }]);
        setVariantInput({ label: '', price: '', contents: '' });
        setShowCustomUnit(false);
    };

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            // Validate file sizes first (10MB limit)
            const MAX_SIZE = 10 * 1024 * 1024;
            const validFiles = files.filter(file => {
                if (file.size > MAX_SIZE) {
                    alert(`File ${file.name} is too large. Maximum size is 10MB.`);
                    return false;
                }
                return true;
            });

            if (validFiles.length === 0) {
                e.target.value = '';
                return;
            }

            const remainingSlots = 5 - previewUrls.length;
            const filesToAdd = validFiles.slice(0, remainingSlots);

            if (filesToAdd.length < validFiles.length) {
                alert('Only 5 images total allowed per product.');
            }

            const newPreviews = filesToAdd.map(file => ({
                url: URL.createObjectURL(file),
                file: file
            }));

            setPreviewUrls([...previewUrls, ...newPreviews]);
            e.target.value = '';
        }
    };

    const removeImage = (index, e) => {
        if (e) e.stopPropagation();
        const newPreviews = previewUrls.filter((_, i) => i !== index);
        setPreviewUrls(newPreviews);
    };

    const handleAddProduct = async (e) => {
        e.preventDefault();
        setIsUploading(true);

        try {
            // 1. Upload new files found in the previewUrls objects
            const filesToUpload = previewUrls.filter(p => p.file).map(p => p.file);

            let uploadedUrls = [];
            if (filesToUpload.length > 0) {
                const formData = new FormData();
                filesToUpload.forEach(file => formData.append('images', file));

                const uploadRes = await fetch(`${API_BASE}/admin/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('venthulir_admin_token') || localStorage.getItem('venthulir_token')}` },
                    body: formData
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    // Ensure image URLs use the production API base if they come back with localhost
                    uploadedUrls = data.imageUrls;
                } else {
                    const errorMsg = await uploadRes.text();
                    console.error("Upload error response:", errorMsg);
                    throw new Error(`Upload Failed: ${errorMsg}`);
                }
            }

            let uploadIdx = 0;
            const finalImages = previewUrls.map(p => {
                if (p.file) {
                    return uploadedUrls[uploadIdx++] || '';
                }
                return p.url;
            }).filter(u => u !== '');

            const productData = {
                ...prodForm,
                price: variants.length > 0 ? variants[0].price : 0,
                images: finalImages,
                imageUrl: finalImages.length > 0 ? finalImages[0] : '',
                variants: variants,
                comboContents: comboContents.filter(c => c.item && c.weight),
                originalPrice: prodForm.originalPrice || undefined,
                discountPercent: prodForm.discountPercent || undefined
            };

            if (isEditing) {
                await api.put(`/admin/products/${editingId}`, productData);
            } else {
                await api.post(`/admin/products`, productData);
            }

            alert(isEditing ? 'Success: Product Updated' : 'Success: Product Added');
            resetForm();
            fetchData();
            setActiveTab('All Products');
        } catch (err) {
            console.error('Submit Error:', err);
            alert('Action failed: ' + err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const resetForm = () => {
        setProdForm({ productCode: '', name: '', price: '', description: '', category: 'General', badge: '', shippingCharge: 0, initialStock: '', originalPrice: '', discountPercent: '', hsnSac: '' });
        setVariants([]);
        setComboContents([]);
        setComboInput({ item: '', weight: '' });
        setPreviewUrls([]);
        setIsEditing(false);
        setEditingId(null);
        setShowCustomUnit(false);
    };

    const handleEditProduct = (p) => {
        setProdForm({
            productCode: p.productCode || '',
            name: p.name,
            price: p.price,
            description: p.description,
            category: p.category,
            badge: p.badge || '',
            shippingCharge: p.shippingCharge || 0,
            initialStock: p.initialStock || 0,
            originalPrice: p.originalPrice || '',
            discountPercent: p.discountPercent || '',
            hsnSac: p.hsnSac || ''
        });
        setVariants(p.variants || []);
        setComboContents(p.comboContents || []);
        setComboInput({ item: '', weight: '' });
        setPreviewUrls((p.images || []).map(url => ({ url, file: null })));
        setIsEditing(true);
        setEditingId(p._id);
        setActiveTab('Add Product');
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/admin/products/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await api.delete(`/admin/users/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete user.');
        }
    };

    const handleDeleteOrder = async (id) => {
        if (!window.confirm('Are you sure you want to delete this order?')) return;
        try {
            await api.delete(`/admin/orders/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete order.');
        }
    };

    const handleResolveMessage = async (id) => {
        const reply = replyTexts[id];
        if (!reply) return alert('Please enter a response for the customer.');

        setIsResolving({ ...isResolving, [id]: true });
        try {
            await api.put(`/admin/messages/${id}/resolve`, { reply });
            alert('Success: Response sent via Email');
            fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setIsResolving({ ...isResolving, [id]: false });
        }
    };

    // ── Offer handlers ─────────────────────────────────────
    const getOfferStatus = (offer) => {
        const now = new Date();
        if (!offer.isActive) return { label: 'Inactive', color: '#94a3b8', bg: '#f1f5f9' };
        if (offer.stock <= 0) return { label: 'Stock Over', color: '#ef4444', bg: '#fee2e2' };
        if (now < new Date(offer.startDate)) return { label: 'Upcoming', color: '#3b82f6', bg: '#dbeafe' };
        if (now > new Date(offer.endDate)) return { label: 'Expired', color: '#64748b', bg: '#f1f5f9' };
        return { label: 'Active', color: '#16a34a', bg: '#dcfce7' };
    };

    const handleOfferFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;
        const MAX_SIZE = 10 * 1024 * 1024;
        const valid = files.filter(f => {
            if (f.size > MAX_SIZE) { alert(`${f.name} exceeds 10MB.`); return false; }
            return true;
        }).slice(0, 5 - offerPreviewUrls.length);
        const previews = valid.map(f => ({ url: URL.createObjectURL(f), file: f }));
        setOfferPreviewUrls(prev => [...prev, ...previews]);
        e.target.value = '';
    };

    const removeOfferImage = (idx, e) => {
        if (e) e.stopPropagation();
        setOfferPreviewUrls(prev => prev.filter((_, i) => i !== idx));
    };

    const resetOfferForm = () => {
        setOfferForm({ name: '', description: '', imageUrl: '', price: '', offerPrice: '', mrpIllusion: '', discountPercent: '', category: 'General', badge: 'Limited Offer', stock: '', rating: '', condition: 'First 60 customers only allowed', comboContents: '', startDate: '', endDate: '' });
        setOfferPreviewUrls([]);
        setIsEditingOffer(false);
        setEditingOfferId(null);
    };

    const handleEditOffer = (o) => {
        setOfferForm({
            name: o.name,
            description: o.description,
            imageUrl: o.imageUrl || '',
            price: o.price,
            offerPrice: o.offerPrice,
            mrpIllusion: o.mrpIllusion || '',
            discountPercent: o.discountPercent || '',
            category: o.category || 'General',
            badge: o.badge || 'Limited Offer',
            stock: o.stock,
            rating: o.rating || '',
            condition: o.condition || 'First 60 customers only allowed',
            comboContents: o.comboContents || '',
            startDate: o.startDate ? new Date(o.startDate).toISOString().split('T')[0] : '',
            endDate: o.endDate ? new Date(o.endDate).toISOString().split('T')[0] : ''
        });
        setOfferPreviewUrls((o.images || []).map(url => ({ url, file: null })));
        setIsEditingOffer(true);
        setEditingOfferId(o._id);
        setActiveTab('Offers');
    };

    const handleSubmitOffer = async (e) => {
        e.preventDefault();
        setIsOfferUploading(true);
        try {
            const filesToUpload = offerPreviewUrls.filter(p => p.file).map(p => p.file);
            let uploadedUrls = [];

            if (filesToUpload.length > 0) {
                const formData = new FormData();
                filesToUpload.forEach(f => formData.append('images', f));
                const uploadRes = await fetch(`${API_BASE}/admin/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('venthulir_admin_token') || localStorage.getItem('venthulir_token')}` },
                    body: formData
                });
                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    uploadedUrls = data.imageUrls;
                } else {
                    throw new Error('Image upload failed.');
                }
            }

            let upIdx = 0;
            const finalImages = offerPreviewUrls.map(p => p.file ? uploadedUrls[upIdx++] || '' : p.url).filter(Boolean);

            const payload = {
                ...offerForm,
                images: finalImages,
                imageUrl: finalImages[0] || offerForm.imageUrl || ''
            };

            if (isEditingOffer) {
                await api.put(`/offers/${editingOfferId}`, payload);
                alert('Offer Updated Successfully');
            } else {
                await api.post('/offers', payload);
                alert('Offer Created Successfully');
            }
            resetOfferForm();
            fetchData();
        } catch (err) {
            console.error('Offer submit error:', err);
            alert('Failed: ' + err.message);
        } finally {
            setIsOfferUploading(false);
        }
    };

    const handleDeleteOffer = async (id) => {
        if (!window.confirm('Delete this offer?')) return;
        try {
            await api.delete(`/offers/${id}`);
            fetchData();
        } catch (err) {
            alert('Delete failed: ' + err.message);
        }
    };

    const handleAddCoupon = async (e) => {
        e.preventDefault();
        try {
            if (isEditingCoupon && editingCouponId) {
                await api.put(`/coupons/${editingCouponId}`, couponForm);
                alert('Success: Coupon Updated');
            } else {
                await api.post('/coupons', couponForm);
                alert('Success: Coupon Generated');
            }
            setCouponForm({ couponCode: '', productId: '', maxUses: 25, expiryDate: '', discountPercentage: 10, status: 'Active' });
            setIsEditingCoupon(false);
            setEditingCouponId(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed: ' + (err.message || 'Unknown error'));
        }
    };

    const handleEditCoupon = (c) => {
        setCouponForm({
            couponCode: c.couponCode,
            productId: c.productId || '',
            maxUses: c.maxUses,
            expiryDate: c.expiryDate ? new Date(c.expiryDate).toISOString().split('T')[0] : '',
            discountPercentage: c.discountPercentage,
            status: c.status
        });
        setIsEditingCoupon(true);
        setEditingCouponId(c._id);
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Delete coupon?')) return;
        try {
            await api.delete(`/coupons/${id}`);
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const getFilteredOrders = () => {
        return orders.filter(o => {
            const d = new Date(o.createdAt);
            if (orderStartDate && d < new Date(orderStartDate)) return false;
            if (orderEndDate && d > new Date(new Date(orderEndDate).setHours(23, 59, 59, 999))) return false;
            return true;
        });
    };

    const exportOrdersToCSV = () => {
        const filtered = getFilteredOrders();
        if (filtered.length === 0) return alert('No orders to export.');

        const headers = ["Order ID", "Date", "Customer Name", "Customer Email", "Phone", "Total Amount", "Status"];
        const rows = filtered.map(o => [
            o._id,
            new Date(o.createdAt).toLocaleString().replace(/,/g, ''),
            o.customerName,
            o.customerEmail,
            o.phone || "N/A",
            o.totalAmount,
            o.status
        ]);

        let csvContent = headers.join(",") + "\n" + rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `venthulir_orders_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'Dashboard':
                return (
                    <div className="fade-in">
                        <div className="admin-stats-grid">
                            <div className="stat-card" onClick={() => setActiveTab('Orders')} role="button" tabIndex="0" aria-label={`View ${stats.orderCount} Orders`}>
                                <h3><ShoppingCart size={18} /> Orders</h3>
                                <p className="stat-value">{stats.orderCount}</p>
                            </div>
                            <div className="stat-card" onClick={() => setActiveTab('All Products')} role="button" tabIndex="0" aria-label={`View ${stats.productCount} Products`}>
                                <h3><Package size={18} /> Products</h3>
                                <p className="stat-value">{stats.productCount}</p>
                            </div>
                            <div className="stat-card" onClick={() => setActiveTab('Users')} role="button" tabIndex="0" aria-label={`View ${stats.userCount} Customers`}>
                                <h3><Users size={18} /> Customers</h3>
                                <p className="stat-value">{stats.userCount}</p>
                            </div>
                            <div className="stat-card" onClick={() => setActiveTab('Queries')} role="button" tabIndex="0" aria-label={`View ${stats.messageCount} Unresolved Queries`}>
                                <h3><ShieldQuestion size={18} /> Queries</h3>
                                <p className="stat-value" style={{ color: stats.messageCount > 0 ? '#ef4444' : '#22c55e' }}>{stats.messageCount}</p>
                            </div>
                            <div className="stat-card" onClick={() => setActiveTab('Inventory')} role="button" tabIndex="0" aria-label={`View ${stats.lowStockCount} Low Stock Items`} style={{ borderLeft: '4px solid #f59e0b' }}>
                                <h3><Activity size={18} /> Low Stock</h3>
                                <p className="stat-value" style={{ color: stats.lowStockCount > 0 ? '#f59e0b' : '#22c55e' }}>{stats.lowStockCount}</p>
                            </div>
                            <div className="stat-card" onClick={() => setActiveTab('Inventory')} role="button" tabIndex="0" aria-label={`View ${stats.outOfStockCount} Out of Stock Items`} style={{ borderLeft: '4px solid #ef4444' }}>
                                <h3><Trash size={18} /> Out of Stock</h3>
                                <p className="stat-value" style={{ color: stats.outOfStockCount > 0 ? '#ef4444' : '#22c55e' }}>{stats.outOfStockCount}</p>
                            </div>
                        </div>
                    </div>
                );
            case 'Add Product':
                return (
                    <div className="admin-form-panel fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '30px' }}>
                        <div className="admin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <h3 style={{ margin: 0 }}>{isEditing ? 'Edit Existing Harvest' : 'Register New Harvest'}</h3>
                                {isEditing && <button onClick={resetForm} className="admin-btn" style={{ background: '#94a3b8', color: '#fff' }}>Cancel</button>}
                            </div>
                            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div className="form-section">
                                    <label className="admin-label">Harvest Gallery (1st slot is primary)</label>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i}
                                                onClick={() => !previewUrls[i] && document.getElementById('fileInput').click()}
                                                style={{
                                                    width: '70px', height: '70px', borderRadius: '10px', border: previewUrls[i] ? '2px solid #0b3d2e' : '2px dashed #cbd5e1',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                                                    background: '#fff', position: 'relative', cursor: 'pointer'
                                                }}
                                                aria-label={previewUrls[i] ? `Image ${i+1}` : `Upload Image ${i+1}`}
                                            >
                                                {previewUrls[i] ? (
                                                    <>
                                                        <img src={previewUrls[i].url} alt="slot" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button
                                                            type="button"
                                                            onClick={(e) => removeImage(i, e)}
                                                            style={{ position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px' }}
                                                            aria-label="Remove image"
                                                        >✕</button>
                                                    </>
                                                ) : <Plus size={16} color="#cbd5e1" />}
                                            </div>
                                        ))}
                                    </div>
                                    <input id="fileInput" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px' }}>
                                    <div>
                                        <label className="admin-label">Product Code</label>
                                        <input type="text" className="admin-input" placeholder="Auto-generated" value={prodForm.productCode} onChange={e => setProdForm({ ...prodForm, productCode: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="admin-label">Name</label>
                                        <input type="text" required className="admin-input" value={prodForm.name} onChange={e => setProdForm({ ...prodForm, name: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="admin-label">HSN/SAC</label>
                                        <input type="text" className="admin-input" placeholder="Optional" value={prodForm.hsnSac || ''} onChange={e => setProdForm({ ...prodForm, hsnSac: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="admin-label">Category</label>
                                        <select className="admin-input" value={prodForm.category} onChange={e => setProdForm({ ...prodForm, category: e.target.value })}>
                                            <option>General</option>
                                            <option>Spices</option>
                                            <option>Essential Oils</option>
                                            <option>Health & Skin Care</option>
                                            <option>Wellness Products</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="admin-label">Badge</label>
                                        <select className="admin-input" value={prodForm.badge} onChange={e => setProdForm({ ...prodForm, badge: e.target.value })}>
                                            <option value="">None</option>
                                            <option>Best Seller</option>
                                            <option>New Arrival</option>
                                            <option>Pure</option>
                                            <option>Premium</option>
                                            <option>Organic</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="admin-label">Initial Stock</label>
                                        <input type="number" min="0" className="admin-input" value={prodForm.initialStock} onChange={e => setProdForm({ ...prodForm, initialStock: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="admin-label">Shipping (₹)</label>
                                        <input type="number" min="0" className="admin-input" value={prodForm.shippingCharge || 0} onChange={e => setProdForm({ ...prodForm, shippingCharge: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="admin-label">MRP Illusion (₹)</label>
                                        <input type="number" className="admin-input" value={prodForm.originalPrice} onChange={e => setProdForm({ ...prodForm, originalPrice: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="admin-label">Discount (%)</label>
                                        <input type="number" className="admin-input" value={prodForm.discountPercent} onChange={e => setProdForm({ ...prodForm, discountPercent: e.target.value })} />
                                    </div>
                                </div>

                                <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px' }}>
                                    <label className="admin-label">Measurements & Pricing</label>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px' }}>For combo packs: fill the <strong>Contents</strong> field to list items with weights (e.g. Turmeric 100g + Chilli 200g)</p>

                                    {/* Row 1: label + price */}
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            placeholder="Size / Label (e.g. 500g or Masala Combo)"
                                            className="admin-input"
                                            style={{ flex: 2, minWidth: '140px' }}
                                            value={variantInput.label}
                                            onChange={e => setVariantInput({ ...variantInput, label: e.target.value })}
                                        />
                                        <input
                                            type="number"
                                            placeholder="Price (₹)"
                                            className="admin-input"
                                            style={{ flex: 1, minWidth: '90px' }}
                                            value={variantInput.price}
                                            onChange={e => setVariantInput({ ...variantInput, price: e.target.value })}
                                        />
                                    </div>

                                    {/* Row 2: combo contents (optional) */}
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            placeholder="Combo contents with weight: e.g. Turmeric 100g + Chilli 200g + Coriander 150g"
                                            className="admin-input"
                                            style={{ flex: 3, minWidth: '200px', borderColor: variantInput.contents ? '#0b2e1f' : undefined }}
                                            value={variantInput.contents}
                                            onChange={e => setVariantInput({ ...variantInput, contents: e.target.value })}
                                        />
                                        <button type="button" onClick={handleAddVariant} className="admin-btn admin-btn-primary" style={{ flexShrink: 0 }}>Add</button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {variants.map((v, i) => (
                                            <div key={i} style={{ background: '#fff', padding: '10px 15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <strong style={{ color: '#0b2e1f' }}>{v.label} — ₹{v.price}</strong>
                                                    <button type="button" onClick={() => removeVariant(i)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px' }} aria-label="Remove variant">✕</button>
                                                </div>
                                                {v.contents && (
                                                    <div style={{ marginTop: '5px', fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 700, color: '#94a3b8' }}>📦 Contents:</span>
                                                        {v.contents.split('+').map((item, j) => (
                                                            <span key={j} style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '1px 8px', borderRadius: '12px', fontWeight: 600 }}>{item.trim()}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* ── Combo Contents ───────────────────────── */}
                                <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px' }}>
                                    <label className="admin-label" style={{ marginBottom: '4px' }}>Combo Contents <span style={{ color: '#94a3b8', fontWeight: 500 }}>(Optional — for combo packs)</span></label>
                                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px' }}>List each item with its weight, e.g. Turmeric Powder — 100g</p>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            style={{ flex: 2, minWidth: '120px' }}
                                            placeholder="Item name (e.g. Turmeric Powder)"
                                            value={comboInput.item}
                                            onChange={e => setComboInput({ ...comboInput, item: e.target.value })}
                                        />
                                        <input
                                            type="text"
                                            className="admin-input"
                                            style={{ flex: 1, minWidth: '80px' }}
                                            placeholder="Weight (e.g. 100g)"
                                            value={comboInput.weight}
                                            onChange={e => setComboInput({ ...comboInput, weight: e.target.value })}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (comboInput.item.trim() && comboInput.weight.trim()) {
                                                        setComboContents([...comboContents, { item: comboInput.item.trim(), weight: comboInput.weight.trim() }]);
                                                        setComboInput({ item: '', weight: '' });
                                                    }
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="admin-btn admin-btn-primary"
                                            onClick={() => {
                                                if (comboInput.item.trim() && comboInput.weight.trim()) {
                                                    setComboContents([...comboContents, { item: comboInput.item.trim(), weight: comboInput.weight.trim() }]);
                                                    setComboInput({ item: '', weight: '' });
                                                }
                                            }}
                                        >Add</button>
                                    </div>
                                    {comboContents.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {comboContents.map((c, i) => (
                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <span style={{ fontSize: '13px', color: '#0b2e1f', fontWeight: 700 }}>📦 {c.item}</span>
                                                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, background: '#f8fafc', padding: '2px 10px', borderRadius: '20px', border: '1px solid #e2e8f0' }}>{c.weight}</span>
                                                    <button type="button" onClick={() => setComboContents(comboContents.filter((_, j) => j !== i))} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', lineHeight: 1 }} aria-label="Remove item">✕</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="form-section">
                                    <label className="admin-label">Public Description</label>
                                    <textarea
                                        required
                                        className="admin-input"
                                        style={{ height: '140px', resize: 'vertical' }}
                                        value={prodForm.description}
                                        onChange={e => setProdForm({ ...prodForm, description: e.target.value })}
                                        placeholder="Enter the royal description..."
                                    ></textarea>
                                </div>
                                <button type="submit" disabled={isUploading} className="admin-btn admin-btn-primary" style={{ width: '100%' }}>
                                    {isUploading ? <><Loader2 size={18} className="spin" /> Securing Data...</> : (isEditing ? 'Update Records' : 'Publish Harvest')}
                                </button>
                            </form>
                        </div>
                        <div className="preview-sticky">
                            <h4 style={{ color: '#64748b', marginBottom: '15px' }}>Live View</h4>
                            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
                                <ProductCard product={{ ...prodForm, price: variants[0]?.price || 0, imageUrl: previewUrls[0]?.url, variants }} />
                            </div>
                        </div>
                    </div>
                );
            case 'Users':
                return (
                    <div className="admin-card fade-in">
                        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Customer</th>
                                        <th>Contact</th>
                                        <th>Delivery Address</th>
                                        <th>Joined</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u._id}>
                                            <td><strong>{u.name}</strong></td>
                                            <td>{u.email}<br /><small>{u.phone}</small></td>
                                            <td>
                                                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                                    {u.deliveryAddress?.address ? `${u.deliveryAddress.address}, ${u.deliveryAddress.city}, ${u.deliveryAddress.state} ${u.deliveryAddress.zipCode}` : 'Not Provided'}
                                                </span>
                                            </td>
                                            <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                <button onClick={() => handleDeleteUser(u._id)} className="admin-btn admin-btn-danger" style={{ padding: '8px' }} aria-label={`Delete customer ${u.name}`}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'Inventory':
                return (
                    <div className="fade-in">
                        {/* ── Summary Stats ── */}
                        <div className="admin-stats-grid">
                            <div className="stat-card" style={{ borderLeft: '4px solid #0b3d2e' }}>
                                <h3>Total Products</h3>
                                <p className="stat-value">{inventory.totalProducts}</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #3b82f6' }}>
                                <h3>Product Stock</h3>
                                <p className="stat-value" style={{ color: '#3b82f6' }}>{inventory.totalStock}</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #d4af37' }}>
                                <h3>Total Offers</h3>
                                <p className="stat-value" style={{ color: '#d4af37' }}>{inventory.totalOffers || 0}</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                                <h3>Offer Stock</h3>
                                <p className="stat-value" style={{ color: '#8b5cf6' }}>{inventory.totalOfferStock || 0}</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                                <h3>Low Stock (&lt;10)</h3>
                                <p className="stat-value" style={{ color: '#f59e0b' }}>{(inventory.lowStockProducts?.length || 0) + (inventory.lowStockOffers?.length || 0)}</p>
                            </div>
                            <div className="stat-card" style={{ borderLeft: '4px solid #ef4444' }}>
                                <h3>Out of Stock</h3>
                                <p className="stat-value" style={{ color: '#ef4444' }}>{(inventory.outOfStockProducts?.length || 0) + (inventory.outOfStockOffers?.length || 0)}</p>
                            </div>
                        </div>

                        {/* ── Products Stock Table ── */}
                        <div className="admin-card" style={{ marginBottom: 24 }}>
                            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Package size={18} style={{ color: '#0b3d2e' }} /> Product Stock Levels
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Code</th>
                                            <th>Category</th>
                                            <th>Initial</th>
                                            <th>Current</th>
                                            <th>Status</th>
                                            <th>Restock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inventory.allProducts?.map(p => {
                                            const isOut = p.currentStock === 0;
                                            const isLow = !isOut && p.currentStock < 10;
                                            return (
                                                <tr key={p._id} style={{ background: isOut ? '#fff5f5' : isLow ? '#fffbeb' : 'inherit' }}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <img src={p.imageUrl} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                                                            <strong>{p.name}</strong>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="admin-badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }}>
                                                            {p.productCode || '—'}
                                                        </span>
                                                    </td>
                                                    <td>{p.category}</td>
                                                    <td>{p.initialStock}</td>
                                                    <td style={{ fontWeight: 800, color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#0b3d2e' }}>
                                                        {p.currentStock}
                                                    </td>
                                                    <td>
                                                        {isOut ? <span className="admin-badge" style={{ background: '#fee2e2', color: '#ef4444' }}>OUT OF STOCK</span>
                                                            : isLow ? <span className="admin-badge" style={{ background: '#fef3c7', color: '#d97706' }}>LOW STOCK</span>
                                                                : <span className="admin-badge" style={{ background: '#dcfce7', color: '#166534' }}>IN STOCK</span>}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                            <input
                                                                type="number" min="1"
                                                                placeholder="Qty"
                                                                className="admin-input"
                                                                style={{ width: 70, padding: '6px 8px' }}
                                                                value={restockInputs[p._id] || ''}
                                                                onChange={e => setRestockInputs(prev => ({ ...prev, [p._id]: e.target.value }))}
                                                                aria-label="Restock quantity"
                                                            />
                                                            <button
                                                                onClick={() => handleRestock(p._id)}
                                                                className="admin-btn admin-btn-primary"
                                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                                aria-label="Add stock"
                                                            >+ Add</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ── Offers Stock Table ── */}
                        <div className="admin-card">
                            <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Tag size={18} style={{ color: '#d4af37' }} /> Offer Stock Levels
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Offer</th>
                                            <th>Category</th>
                                            <th>Offer Price</th>
                                            <th>Current Stock</th>
                                            <th>Status</th>
                                            <th>Restock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(inventory.allOffers || []).length === 0 ? (
                                            <tr><td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '30px' }}>No offers found.</td></tr>
                                        ) : (inventory.allOffers || []).map(o => {
                                            const isOut = o.stock === 0;
                                            const isLow = !isOut && o.stock < 10;
                                            return (
                                                <tr key={o._id} style={{ background: isOut ? '#fff5f5' : isLow ? '#fffbeb' : 'inherit' }}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <img
                                                                src={o.imageUrl || 'https://placehold.co/36x36/0b3d2e/d4af37?text=O'}
                                                                alt=""
                                                                style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }}
                                                                onError={e => { e.target.src = 'https://placehold.co/36x36/0b3d2e/d4af37?text=O'; }}
                                                            />
                                                            <strong>{o.name}</strong>
                                                        </div>
                                                    </td>
                                                    <td>{o.category}</td>
                                                    <td style={{ color: '#16a34a', fontWeight: 700 }}>₹{o.offerPrice}</td>
                                                    <td style={{ fontWeight: 800, color: isOut ? '#ef4444' : isLow ? '#f59e0b' : '#0b3d2e' }}>
                                                        {o.stock}
                                                    </td>
                                                    <td>
                                                        {isOut ? <span className="admin-badge" style={{ background: '#fee2e2', color: '#ef4444' }}>OUT OF STOCK</span>
                                                            : isLow ? <span className="admin-badge" style={{ background: '#fef3c7', color: '#d97706' }}>LOW STOCK</span>
                                                                : <span className="admin-badge" style={{ background: '#dcfce7', color: '#166534' }}>IN STOCK</span>}
                                                    </td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                            <input
                                                                type="number" min="1"
                                                                placeholder="Qty"
                                                                className="admin-input"
                                                                style={{ width: 70, padding: '6px 8px' }}
                                                                value={offerRestockInputs[o._id] || ''}
                                                                onChange={e => setOfferRestockInputs(prev => ({ ...prev, [o._id]: e.target.value }))}
                                                                aria-label="Restock offer quantity"
                                                            />
                                                            <button
                                                                onClick={() => handleRestockOffer(o._id)}
                                                                className="admin-btn admin-btn-primary"
                                                                style={{ padding: '6px 12px', fontSize: '12px', background: '#7c3aed' }}
                                                                aria-label="Add offer stock"
                                                            >+ Add</button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'Orders':
                return (
                    <div className="admin-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '20px' }}>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div>
                                    <label className="admin-label">Start Date</label>
                                    <input type="date" className="admin-input" value={orderStartDate} onChange={(e) => setOrderStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="admin-label">End Date</label>
                                    <input type="date" className="admin-input" value={orderEndDate} onChange={(e) => setOrderEndDate(e.target.value)} />
                                </div>
                                <button onClick={() => { setOrderStartDate(''); setOrderEndDate(''); }} className="admin-btn" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#475569' }}>
                                    Clear
                                </button>
                            </div>
                            <button onClick={exportOrdersToCSV} className="admin-btn" style={{ background: '#10b981', color: 'white' }}>
                                <Download size={18} /> Export CSV
                            </button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Delivery</th>
                                        <th>Summary</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getFilteredOrders().map(o => (
                                        <tr key={o._id}>
                                            <td>
                                                <strong>{new Date(o.createdAt).toLocaleDateString()}</strong><br />
                                                <small style={{ color: '#64748b' }}>{new Date(o.createdAt).toLocaleTimeString()}</small>
                                            </td>
                                            <td>
                                                <strong style={{ color: '#0b3d2e' }}>{o.customerName}</strong><br />
                                                <a href={`mailto:${o.customerEmail}`} style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>{o.customerEmail}</a><br />
                                                <small style={{ fontWeight: 'bold' }}>📞 {o.phone || 'N/A'}</small>
                                            </td>
                                            <td>
                                                {o.deliveryAddress ? (
                                                    <div style={{ fontSize: '12px', color: '#475569', maxWidth: '200px' }}>
                                                        {o.deliveryAddress.address},<br />
                                                        {o.deliveryAddress.city}, {o.deliveryAddress.state} - {o.deliveryAddress.zipCode}
                                                    </div>
                                                ) : <span style={{ color: '#ef4444', fontSize: '12px' }}>Not Provided</span>}
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                                                    {o.items?.map((item, idx) => (
                                                        <div key={idx}>• {item.quantity}x {item.name} {item.variant ? `(${item.variant})` : ''}</div>
                                                    ))}
                                                </div>
                                                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Subtotal:</span>
                                                        <span>₹{o.originalAmount ? o.originalAmount : o.totalAmount}</span>
                                                    </div>
                                                    {(o.shippingCharge || 0) > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                                                            <span>Shipping:</span>
                                                            <span>+ ₹{o.shippingCharge}</span>
                                                        </div>
                                                    )}
                                                    {o.discountAmount > 0 && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534', marginTop: '2px' }}>
                                                            <span>Discount:</span>
                                                            <span>- ₹{o.discountAmount}</span>
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginTop: '4px', borderTop: '1px solid #e2e8f0', paddingTop: '4px' }}>
                                                        <span>Total:</span>
                                                        <span>₹{o.totalAmount}</span>
                                                    </div>
                                                </div>
                                                <div className="admin-badge" style={{ marginTop: '8px', background: '#fdfcf7', border: '1px solid #f0ede0', color: '#d4af37' }}>
                                                    {o.paymentMethod || 'COD'}
                                                </div>
                                            </td>
                                            <td>
                                                <select
                                                    value={o.status}
                                                    onChange={e => handleUpdateOrderStatus(o._id, e.target.value)}
                                                    className="admin-input"
                                                    style={{
                                                        padding: '6px 10px', width: 'auto',
                                                        background: o.status === 'Cancelled' ? '#fee2e2' : o.status === 'Delivered' ? '#dcfce7' : o.status === 'Returned' ? '#fef3c7' : '#f1f5f9',
                                                        color: o.status === 'Cancelled' ? '#ef4444' : o.status === 'Delivered' ? '#166534' : o.status === 'Returned' ? '#d97706' : '#475569',
                                                        fontWeight: 'bold', border: 'none'
                                                    }}
                                                    aria-label="Order Status"
                                                >
                                                    {['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'].map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        onClick={() => setSelectedOrderInvoice(o)} 
                                                        className="admin-btn" 
                                                        style={{ padding: '8px', background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#0f172a' }} 
                                                        title="View Invoice"
                                                        aria-label="View Invoice"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteOrder(o._id)} className="admin-btn admin-btn-danger" style={{ padding: '8px' }} aria-label="Delete order">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'Coupons':
                return (
                    <div className="admin-form-panel fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                        <div className="admin-card">
                            <h3 style={{ marginBottom: '20px' }}>Generate Coupon</h3>
                            <form onSubmit={handleAddCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label className="admin-label">Coupon Code</label>
                                    <input required type="text" className="admin-input" value={couponForm.couponCode} onChange={e => setCouponForm({ ...couponForm, couponCode: e.target.value })} placeholder="e.g. SUMMER25" />
                                </div>
                                <div>
                                    <label className="admin-label">Target Product (Optional)</label>
                                    <select className="admin-input" value={couponForm.productId} onChange={e => setCouponForm({ ...couponForm, productId: e.target.value })}>
                                        <option value="">-- Apply to Generic Cart --</option>
                                        {products.map(p => <option key={p._id} value={p._id}>{p.name} {p.productCode ? `(${p.productCode})` : ''}</option>)}
                                    </select>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label className="admin-label">Max Uses</label>
                                        <input required type="number" className="admin-input" value={couponForm.maxUses} onChange={e => setCouponForm({ ...couponForm, maxUses: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="admin-label">Discount %</label>
                                        <input required type="number" min="1" max="100" className="admin-input" value={couponForm.discountPercentage} onChange={e => setCouponForm({ ...couponForm, discountPercentage: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="admin-label">Expiry Date</label>
                                    <input required type="date" className="admin-input" value={couponForm.expiryDate} onChange={e => setCouponForm({ ...couponForm, expiryDate: e.target.value })} />
                                </div>
                                <button type="submit" className="admin-btn admin-btn-primary" style={{ width: '100%' }}>{isEditingCoupon ? 'Update Coupon' : 'Save Coupon'}</button>
                                {isEditingCoupon && (
                                    <button type="button" onClick={() => { setIsEditingCoupon(false); setEditingCouponId(null); setCouponForm({ couponCode: '', productId: '', maxUses: 25, expiryDate: '', discountPercentage: 10, status: 'Active' }); }} className="admin-btn" style={{ background: '#64748b', color: '#fff', marginTop: '8px' }}>Cancel Edit</button>
                                )}
                            </form>
                        </div>
                        <div className="admin-card">
                            <h3 style={{ marginBottom: '20px' }}>Active Coupons</h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Code</th>
                                            <th>Discount</th>
                                            <th>Uses</th>
                                            <th>Expires</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {coupons.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                                    No coupons generated yet. Start by creating one on the left.
                                                </td>
                                            </tr>
                                        ) : coupons.map(c => (
                                            <tr key={c._id}>
                                                <td>
                                                    <strong>{c.couponCode}</strong>
                                                    {c.productId && (
                                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                                                            Applied to: <strong>{c.productId.productCode || '—'}</strong>
                                                        </div>
                                                    )}
                                                </td>
                                                <td>{c.discountPercentage}%</td>
                                                <td>{c.usedCount} / {c.maxUses}</td>
                                                <td>{new Date(c.expiryDate).toLocaleDateString()}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <button onClick={() => handleEditCoupon(c)} className="admin-btn admin-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} aria-label="Edit coupon">Edit</button>
                                                        <button onClick={() => handleDeleteCoupon(c._id)} className="admin-btn admin-btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} aria-label="Delete coupon">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case 'Queries':
                return (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {messages.length === 0 ? (
                            <div className="admin-card" style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>
                                <ShieldQuestion size={48} style={{ margin: '0 auto 15px', display: 'block' }} />
                                <p>No customer messages or support queries found. All clear!</p>
                            </div>
                        ) : messages.map(m => (
                            <div key={m._id} className="admin-card" style={{ borderLeft: m.status === 'Open' ? '5px solid #d4af37' : '5px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{m.customerName}</h4>
                                        <small>{m.customerEmail} • {new Date(m.createdAt).toLocaleDateString()}</small>
                                    </div>
                                    <span className="admin-badge" style={{ color: m.status === 'Open' ? '#d4af37' : '#94a3b8' }}>{m.status.toUpperCase()}</span>
                                </div>
                                <p style={{ fontStyle: 'italic', background: '#f8fafc', padding: '15px', borderRadius: '8px', color: '#475569', border: '1px solid #e2e8f0' }}>"{m.message}"</p>
                                {m.status === 'Open' ? (
                                    <div style={{ marginTop: '20px' }}>
                                        <textarea
                                            placeholder="Write reply..."
                                            className="admin-input"
                                            style={{ minHeight: '80px', marginBottom: '10px' }}
                                            value={replyTexts[m._id] || ''}
                                            onChange={e => setReplyTexts({ ...replyTexts, [m._id]: e.target.value })}
                                            aria-label="Reply message"
                                        />
                                        <button
                                            disabled={isResolving[m._id]}
                                            onClick={() => handleResolveMessage(m._id)}
                                            className="admin-btn admin-btn-primary"
                                            style={{ color: '#d4af37' }}
                                        >
                                            {isResolving[m._id] ? <><Loader2 size={16} className="spin" /> Sending...</> : 'Respond & Resolve'}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '10px', fontSize: '14px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                                        <strong>Reply:</strong> {m.reply}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                );
            case 'Activity':
                return (
                    <div className="admin-card fade-in">
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>User</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {activityLogs.map((log, i) => (
                                        <tr key={i}>
                                            <td>{new Date(log.timestamp).toLocaleTimeString()}</td>
                                            <td>{log.userName}</td>
                                            <td><code style={{ background: '#f1f5f9', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>{log.action}</code></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            case 'All Products': {
                const filteredProducts = products.filter(p => {
                    const term = productSearchTerm.toLowerCase();
                    return (
                        (p.name && p.name.toLowerCase().includes(term)) ||
                        (p.productCode && p.productCode.toLowerCase().includes(term)) ||
                        (p.hsnSac && p.hsnSac.toLowerCase().includes(term))
                    );
                });
                return (
                    <div className="admin-card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0 }}>Product Inventory ({filteredProducts.length})</h3>
                            <div style={{ position: 'relative', width: '300px' }}>
                                <input
                                    type="text"
                                    placeholder="Search by name, SKU, or HSN/SAC..."
                                    value={productSearchTerm}
                                    onChange={e => setProductSearchTerm(e.target.value)}
                                    className="admin-input"
                                    style={{ paddingLeft: '35px', margin: 0, width: '100%' }}
                                />
                                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Product Code</th>
                                        <th>HSN/SAC</th>
                                        <th>Price</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map(p => (
                                        <tr key={p._id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                    <img src={p.imageUrl} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                                                    <strong>{p.name}</strong>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="admin-badge" style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #86efac' }}>
                                                    {p.productCode || '—'}
                                                </span>
                                            </td>
                                            <td>
                                                {p.hsnSac ? (
                                                    <span className="admin-badge" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                                                        {p.hsnSac}
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td>₹{p.price}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <button onClick={() => handleEditProduct(p)} className="admin-btn" style={{ padding: '8px', background: '#f1f5f9' }} aria-label="Edit product"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteProduct(p._id)} className="admin-btn admin-btn-danger" style={{ padding: '8px' }} aria-label="Delete product"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            }
            case 'Offers':
                return (
                    <div className="admin-form-panel fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                        {/* ── Form ── */}
                        <div className="admin-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Tag size={20} style={{ color: '#d4af37' }} />
                                    {isEditingOffer ? 'Edit Offer' : 'Create New Offer'}
                                </h3>
                                {isEditingOffer && <button onClick={resetOfferForm} className="admin-btn" style={{ background: '#94a3b8', color: '#fff' }}>Cancel</button>}
                            </div>

                            <form onSubmit={handleSubmitOffer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Images */}
                                <div className="form-section">
                                    <label className="admin-label">Offer Images (up to 5)</label>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i}
                                                onClick={() => !offerPreviewUrls[i] && document.getElementById('offerFileInput').click()}
                                                style={{ width: '70px', height: '70px', borderRadius: '10px', border: offerPreviewUrls[i] ? '2px solid #d4af37' : '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#f8fafc', position: 'relative', cursor: 'pointer' }}
                                                aria-label={offerPreviewUrls[i] ? `Image ${i+1}` : `Upload Image ${i+1}`}
                                            >
                                                {offerPreviewUrls[i] ? (
                                                    <>
                                                        <img src={offerPreviewUrls[i].url} alt={`offer-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button type="button" onClick={(e) => removeOfferImage(i, e)} style={{ position: 'absolute', top: '2px', right: '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', cursor: 'pointer' }} aria-label="Remove image">✕</button>
                                                    </>
                                                ) : <Plus size={16} color="#cbd5e1" />}
                                            </div>
                                        ))}
                                    </div>
                                    <input id="offerFileInput" type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleOfferFileChange} />
                                    <div style={{ marginTop: '8px' }}>
                                        <label className="admin-label" style={{ marginBottom: '4px' }}>Or paste Image URL</label>
                                        <input type="url" className="admin-input" placeholder="https://..." value={offerForm.imageUrl} onChange={e => setOfferForm({ ...offerForm, imageUrl: e.target.value })} />
                                    </div>
                                </div>

                                {/* Core fields */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
                                    <div>
                                        <label className="admin-label">Product Name *</label>
                                        <input required type="text" className="admin-input" value={offerForm.name} onChange={e => setOfferForm({ ...offerForm, name: e.target.value })} placeholder="e.g. Cold-Pressed Oil" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Category</label>
                                        <select className="admin-input" value={offerForm.category} onChange={e => setOfferForm({ ...offerForm, category: e.target.value })}>
                                            <option>General</option><option>Spices</option><option>Essential Oils</option><option>Health &amp; Skin Care</option><option>Wellness Products</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="admin-label">Condition</label>
                                        <input
                                            type="text"
                                            className="admin-input"
                                            value={offerForm.condition}
                                            onChange={e => setOfferForm({ ...offerForm, condition: e.target.value })}
                                            placeholder="e.g. First 60 customers only allowed"
                                        />
                                    </div>
                                    <div>
                                        <label className="admin-label">Badge Label</label>
                                        <input type="text" className="admin-input" value={offerForm.badge} onChange={e => setOfferForm({ ...offerForm, badge: e.target.value })} placeholder="Limited Offer" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Original Price (₹) *</label>
                                        <input required type="number" min="1" step="0.01" className="admin-input" value={offerForm.price} onChange={e => {
                                            const p = e.target.value;
                                            const disc = offerForm.offerPrice && p ? Math.round(((parseFloat(p) - parseFloat(offerForm.offerPrice)) / parseFloat(p)) * 100) : '';
                                            setOfferForm({ ...offerForm, price: p, discountPercent: disc || offerForm.discountPercent });
                                        }} placeholder="e.g. 500" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Offer Price (₹) *</label>
                                        <input required type="number" min="1" step="0.01" className="admin-input" value={offerForm.offerPrice} onChange={e => {
                                            const op = e.target.value;
                                            const disc = offerForm.price && op ? Math.round(((parseFloat(offerForm.price) - parseFloat(op)) / parseFloat(offerForm.price)) * 100) : '';
                                            setOfferForm({ ...offerForm, offerPrice: op, discountPercent: disc || offerForm.discountPercent });
                                        }} placeholder="e.g. 350" />
                                    </div>
                                    <div>
                                        <label className="admin-label">MRP Illusion (₹)</label>
                                        <input type="number" min="1" step="0.01" className="admin-input" value={offerForm.mrpIllusion} onChange={e => setOfferForm({ ...offerForm, mrpIllusion: e.target.value })} placeholder="Displayed strikethrough MRP" />
                                        <small style={{ color: '#94a3b8', fontSize: '10px', marginTop: '3px', display: 'block' }}>Optional higher MRP shown as strikethrough to customer</small>
                                    </div>
                                    <div>
                                        <label className="admin-label">Discount (%)</label>
                                        <input type="number" min="1" max="99" step="1" className="admin-input" value={offerForm.discountPercent} onChange={e => setOfferForm({ ...offerForm, discountPercent: e.target.value })} placeholder="Auto-calculated or set manually" />
                                        <small style={{ color: '#94a3b8', fontSize: '10px', marginTop: '3px', display: 'block' }}>Auto-fills from price fields — override if needed</small>
                                    </div>
                                    <div>
                                        <label className="admin-label">Stock Units *</label>
                                        <input required type="number" min="0" className="admin-input" value={offerForm.stock} onChange={e => setOfferForm({ ...offerForm, stock: e.target.value })} placeholder="e.g. 60" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Rating (0–5)</label>
                                        <input type="number" min="0" max="5" step="0.1" className="admin-input" value={offerForm.rating} onChange={e => setOfferForm({ ...offerForm, rating: e.target.value })} placeholder="e.g. 4.5" />
                                    </div>
                                    <div>
                                        <label className="admin-label">Start Date *</label>
                                        <input required type="date" className="admin-input" value={offerForm.startDate} onChange={e => setOfferForm({ ...offerForm, startDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="admin-label">End Date *</label>
                                        <input required type="date" className="admin-input" value={offerForm.endDate} onChange={e => setOfferForm({ ...offerForm, endDate: e.target.value })} />
                                    </div>
                                </div>

                                {/* Description & Combo */}
                                <div>
                                    <label className="admin-label">Description *</label>
                                    <textarea required className="admin-input" style={{ height: '100px', resize: 'vertical', marginBottom: '15px' }} value={offerForm.description} onChange={e => setOfferForm({ ...offerForm, description: e.target.value })} placeholder="Describe the offer product..." />
                                </div>
                                <div>
                                    <label className="admin-label">Combo Contents <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'normal' }}>(Optional)</span></label>
                                    <input type="text" className="admin-input" value={offerForm.comboContents} onChange={e => setOfferForm({ ...offerForm, comboContents: e.target.value })} placeholder="e.g. Turmeric 100g + Chilli 200g + Coriander 150g" />
                                    <small style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px', display: 'block' }}>Separate items with a plus (+) sign. They will appear as a numbered list on the offer card.</small>
                                </div>

                                {/* Discount preview */}
                                {offerForm.price && offerForm.offerPrice && parseFloat(offerForm.price) > 0 && (
                                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px 16px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '13px', color: '#166534', fontWeight: '700' }}>
                                            Discount: {Math.round(((parseFloat(offerForm.price) - parseFloat(offerForm.offerPrice)) / parseFloat(offerForm.price)) * 100)}%
                                        </span>
                                        <span style={{ fontSize: '13px', color: '#166534', fontWeight: '700' }}>
                                            Customer Saves: ₹{(parseFloat(offerForm.price) - parseFloat(offerForm.offerPrice)).toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                )}

                                <button type="submit" disabled={isOfferUploading} className="admin-btn admin-btn-primary" style={{ width: '100%', padding: '14px' }}>
                                    {isOfferUploading ? <><Loader2 size={18} className="spin" /> Publishing...</> : (isEditingOffer ? 'Update Offer' : 'Publish Offer 🔥')}
                                </button>
                            </form>
                        </div>

                        {/* ── Offers List ── */}
                        <div className="admin-card">
                            <h3 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Tag size={18} style={{ color: '#d4af37' }} /> All Offers
                                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8', fontWeight: '400' }}>{offers.length} total</span>
                            </h3>

                            {offers.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                                    <Tag size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
                                    <p>No offers created yet. Use the form above to publish your first offer.</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Offer</th>
                                                <th>Price</th>
                                                <th>Offer Price</th>
                                                <th>Stock</th>
                                                <th>Duration</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {offers.map(o => {
                                                const st = getOfferStatus(o);
                                                return (
                                                    <tr key={o._id}>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <img
                                                                    src={o.imageUrl || 'https://placehold.co/40x40/0b3d2e/d4af37?text=O'}
                                                                    alt={o.name}
                                                                    loading="lazy"
                                                                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                                                                    onError={e => { e.target.src = 'https://placehold.co/40x40/0b3d2e/d4af37?text=O'; }}
                                                                />
                                                                <div>
                                                                    <strong style={{ display: 'block', maxWidth: '180px' }}>{o.name}</strong>
                                                                    <small style={{ color: '#64748b' }}>{o.category}</small>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td><span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>₹{o.price}</span></td>
                                                        <td><strong style={{ color: '#16a34a' }}>₹{o.offerPrice}</strong></td>
                                                        <td style={{ fontWeight: '700', color: o.stock <= 0 ? '#ef4444' : o.stock < 10 ? '#f59e0b' : '#0b3d2e' }}>{o.stock}</td>
                                                        <td style={{ fontSize: '12px', color: '#475569' }}>
                                                            <div>{new Date(o.startDate).toLocaleDateString('en-IN')}</div>
                                                            <div style={{ color: '#94a3b8' }}>→ {new Date(o.endDate).toLocaleDateString('en-IN')}</div>
                                                        </td>
                                                        <td>
                                                            <span className="admin-badge" style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}30` }}>
                                                                {st.label}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                                <button onClick={() => handleEditOffer(o)} className="admin-btn" style={{ padding: '7px 12px', background: '#f1f5f9', fontSize: '12px' }} aria-label="Edit offer"><Edit2 size={14} /></button>
                                                                <button onClick={() => handleDeleteOffer(o._id)} className="admin-btn admin-btn-danger" style={{ padding: '7px 12px', fontSize: '12px' }} aria-label="Delete offer"><Trash2 size={14} /></button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout}>
            <>
                <div className="admin-page-root fade-in">
                    {renderContent()}
                </div>
                <InvoiceModal 
                    isOpen={!!selectedOrderInvoice} 
                    onClose={() => setSelectedOrderInvoice(null)} 
                    orderData={selectedOrderInvoice} 
                />
                <style>{`
                    .admin-page-root { animation: fadeIn 0.4s ease forwards; }
                    .fade-in { animation: fadeIn 0.4s ease forwards; }
                    .fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; }
                    .fade-in-scale { animation: fadeInScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
                    
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                    @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                    .spin { animation: spin 1s linear infinite; }

                    .admin-stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 25px; }
                    .stat-card { background: #fff; padding: 24px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #edf2f7; cursor: pointer; transition: all 0.2s; }
                    .stat-card:hover { transform: translateY(-4px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-color: #d4af37; }
                    .stat-card h3 { font-size: 14px; font-weight: 700; color: #64748b; text-transform: uppercase; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
                    .stat-value { font-size: 32px; font-weight: 800; color: #0b3d2e; margin: 0; }

                    .admin-card { background: #fff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); width: 100%; box-sizing: border-box; }
                    .admin-table { width: 100%; border-collapse: collapse; }
                    .admin-table th { padding: 12px 15px; text-align: left; border-bottom: 2px solid #f1f5f9; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
                    .admin-table td { padding: 12px 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; vertical-align: middle; }
                    .admin-table tr { transition: background 0.2s; }
                    .admin-table tr:hover { background: #f8fafc; }

                    .admin-input { width: 100%; padding: 10px 15px; border-radius: 8px; border: 1px solid #e2e8f0; font-size: 14px; transition: all 0.2s; box-sizing: border-box; font-family: inherit; }
                    .admin-input:focus { border-color: #d4af37; outline: none; box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1); }
                    .admin-label { display: block; font-size: 12px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

                    .admin-btn { padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; border: none; font-size: 14px; justify-content: center; }
                    .admin-btn-primary { background: #0b3d2e; color: #fff; }
                    .admin-btn-primary:hover { background: #082f23; transform: translateY(-1px); }
                    .admin-btn-danger { background: #fee2e2; color: #ef4444; }
                    .admin-btn-danger:hover { background: #fecaca; }
                    
                    .admin-badge { padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; text-transform: uppercase; display: inline-block; }
                `}</style>
            </>
        </AdminLayout>
    );
}

export default AdminPage;
