import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Printer, Download } from 'lucide-react';
import logo from '../assets/organic.png';

const InvoiceModal = ({ isOpen, onClose, orderData }) => {
    if (!orderData) return null;


    const orderId = String(orderData._id || orderData.id || '');
    const shortId = orderId.slice(-8).toUpperCase();
    const orderDate = orderData.createdAt
        ? new Date(orderData.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'N/A';
    const orderTime = orderData.createdAt
        ? new Date(orderData.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
        : 'N/A';

    const subtotal = orderData.originalAmount || orderData.totalAmount || 0;
    const discount = orderData.discountAmount || 0;
    const shipping = orderData.shippingCharge || 0;
    const total = orderData.totalAmount || 0;

    // GST Calculation: Spices & Herbal Spices have 5% GST
    const gstRate = 5;
    const calculateGstDetails = (amount) => {
        const taxable = amount / (1 + gstRate / 100);
        const gstAmount = amount - taxable;
        return { taxable, gstAmount };
    };

    const overallGst = calculateGstDetails(total - shipping);

    const numberToWords = (num) => {
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const convert = (n) => {
            if (n < 20) return a[n];
            if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
            if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
            if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
            if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
            return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
        };

        const integerPart = Math.floor(num);
        if (integerPart === 0) return 'Zero Rupees Only';
        return convert(integerPart) + ' Rupees Only';
    };

    const handlePrint = () => {
        const printAreaElement = document.querySelector('.print-area');
        if (!printAreaElement) return;

        const printContent = printAreaElement.innerHTML;
        const originalTitle = document.title;
        
        // Temporarily change document title for print header
        document.title = `Tax_Invoice_${shortId}`;
        
        // Create a temporary div for printing
        const printDiv = document.createElement('div');
        printDiv.className = 'temp-print-container';
        printDiv.innerHTML = printContent;
        
        // Add styling to ensure it takes full page and fits perfectly
        const style = document.createElement('style');
        style.innerHTML = `
            @media print {
                body > * { display: none !important; }
                body > .temp-print-container { display: block !important; width: 100% !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; }
                .temp-print-container { box-sizing: border-box !important; }
                .temp-print-container > div { border: none !important; padding: 0 !important; margin: 0 !important; }
                @page { size: portrait; margin: 10mm; }
            }
        `;
        
        document.body.appendChild(style);
        document.body.appendChild(printDiv);
        
        window.print();
        
        // Clean up immediately after print dialog resolves
        document.body.removeChild(printDiv);
        document.body.removeChild(style);
        document.title = originalTitle;
    };

    const handleDownload = () => {
        const printAreaElement = document.querySelector('.print-area');
        if (!printAreaElement) return;

        const opt = {
            margin:       [15, 12, 15, 12],
            filename:     `Invoice-${shortId}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2.5, useCORS: true, logging: false },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        const triggerSave = () => {
            window.html2pdf().from(printAreaElement).set(opt).save();
        };

        if (window.html2pdf) {
            triggerSave();
        } else {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
            script.onload = triggerSave;
            document.body.appendChild(script);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="invoice-modal-overlay"
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                        background: 'rgba(10, 46, 31, 0.8)', backdropFilter: 'blur(4px)',
                        padding: '40px 16px', overflowY: 'auto'
                    }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={e => e.stopPropagation()}
                        className="invoice-modal-content"
                        style={{
                            background: '#FFFFFF',
                            borderRadius: '16px',
                            width: '100%',
                            maxWidth: '800px',
                            boxShadow: '0 20px 50px rgba(10, 46, 31, 0.15)',
                            position: 'relative',
                            fontFamily: 'Inter, sans-serif',
                            color: '#2F2F2F',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Close button (Hidden during printing) */}
                        <button
                            onClick={onClose}
                            className="no-print close-modal-btn"
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: '#F3F4F6',
                                border: '1px solid #E5E7EB',
                                cursor: 'pointer',
                                color: '#374151',
                                zIndex: 50,
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = '#E5E7EB';
                                e.currentTarget.style.color = '#111827';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = '#F3F4F6';
                                e.currentTarget.style.color = '#374151';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div style={{ padding: '30px 40px' }} className="print-area">
                            {/* A4 Container Box */}
                            <div style={{ border: '1px solid #E7E5DD', padding: '20px', borderRadius: '12px' }}>

                                {/* 1. Header (Logo & Company Details) */}
                                <div className="invoice-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #E7E5DD', paddingBottom: '12px' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                            <img src={logo} alt="Venthulir Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
                                            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0A2E1F', letterSpacing: '1px' }}>VENTHULIR</h2>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>Venthulir Organic Harvest Reserves</p>
                                        <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#6B7280' }}>2nd Floor, Royal Residency Towers, Fairlands, Salem - 636004</p>
                                        <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#6B7280' }}>GSTIN: 33AAAAA1111A1Z1</p>
                                    </div>
                                    <div className="invoice-header-right-label" style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Original Copy</span>
                                    </div>
                                </div>

                                {/* 2. Title Bar */}
                                <div style={{ background: '#0A2E1F', color: '#FFFFFF', textAlign: 'center', padding: '8px', fontSize: '16px', fontWeight: 800, letterSpacing: '2px', borderRadius: '6px', marginBottom: '16px' }}>
                                    TAX INVOICE
                                </div>

                                {/* 3. Bill To & Invoice Info Columns */}
                                <div className="invoice-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #E7E5DD', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
                                    {/* Left Column: Bill To */}
                                    <div style={{ borderRight: '1px solid #E7E5DD', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ background: '#FAF8F3', borderBottom: '1px solid #E7E5DD', padding: '8px 12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#2F2F2F', letterSpacing: '0.5px' }}>
                                            Invoice On (Bill To):
                                        </div>
                                        <div style={{ padding: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Name</span>
                                                <span>: {orderData.customerName || 'Customer'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Address</span>
                                                <span>: {orderData.deliveryAddress?.address || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Phone</span>
                                                <span>: {orderData.phone || 'N/A'}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Place Of Supply</span>
                                                <span>: {orderData.deliveryAddress?.state || 'Tamil Nadu'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Invoice Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ background: '#FAF8F3', borderBottom: '1px solid #E7E5DD', padding: '8px 12px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: '#2F2F2F', letterSpacing: '0.5px' }}>
                                            Invoice Details:
                                        </div>
                                        <div style={{ padding: '16px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Invoice No</span>
                                                <span>: INV-{shortId}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Order ID</span>
                                                <span>: #{shortId}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Date</span>
                                                <span>: {orderDate}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Time</span>
                                                <span>: {orderTime}</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr' }}>
                                                <span style={{ color: '#6B7280', fontWeight: 600 }}>Status</span>
                                                <span style={{ fontWeight: 700, color: orderData.status === 'Cancelled' ? '#DC2626' : '#0A2E1F' }}>: {orderData.status || 'Processing'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 4. Products Table */}
                                <div style={{ overflowX: 'auto', marginBottom: '16px', border: '1px solid #E7E5DD', borderRadius: '8px' }}>
                                    <table className="invoice-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                        <thead>
                                            <tr style={{ background: '#0A2E1F', color: '#FFFFFF' }}>
                                                <th className="text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>S.No</th>
                                                <th className="text-left" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>Product Name</th>
                                                <th className="text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>HSN/SAC</th>
                                                <th className="text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>Qty</th>
                                                <th className="text-right" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>Rate</th>
                                                <th className="text-right" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>Taxable</th>
                                                <th className="text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>GST %</th>
                                                <th className="text-right" style={{ borderRight: '1px solid rgba(255,255,255,0.1)' }}>GST Amt</th>
                                                <th className="text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orderData.items.map((item, idx) => {
                                                const itemTotal = (item.price || 0) * (item.quantity || 1);
                                                const gstDetails = calculateGstDetails(itemTotal);
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid #E7E5DD' }}>
                                                        <td className="text-center" style={{ borderRight: '1px solid #E7E5DD' }}>{idx + 1}</td>
                                                        <td className="text-left" style={{ fontWeight: 600, borderRight: '1px solid #E7E5DD' }}>
                                                            {item.name}
                                                            {item.variant && item.variant !== 'Standard' && (
                                                                <span style={{ display: 'block', fontSize: '11px', color: '#6B7280', fontWeight: 'normal' }}>Size: {item.variant}</span>
                                                            )}
                                                        </td>
                                                        <td className="text-center" style={{ borderRight: '1px solid #E7E5DD', fontFamily: 'monospace' }}>{item.hsnSac || ''}</td>
                                                        <td className="text-center" style={{ borderRight: '1px solid #E7E5DD' }}>{item.quantity || 1}</td>
                                                        <td className="text-right" style={{ borderRight: '1px solid #E7E5DD' }}>₹{(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                        <td className="text-right" style={{ borderRight: '1px solid #E7E5DD' }}>₹{gstDetails.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="text-center" style={{ borderRight: '1px solid #E7E5DD' }}>{gstRate}%</td>
                                                        <td className="text-right" style={{ borderRight: '1px solid #E7E5DD' }}>₹{gstDetails.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                        <td className="text-right" style={{ fontWeight: 700 }}>₹{itemTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* 5. Bottom Calculations & Bank Info */}
                                <div className="invoice-bottom-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '16px' }}>
                                    {/* Left Side: Words & Bank */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div>
                                            <h5 style={{ margin: '0 0 4px', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Amount In Words:</h5>
                                            <strong style={{ fontSize: '13px', color: '#0A2E1F' }}>{numberToWords(total)}</strong>
                                        </div>

                                        <div style={{ border: '1px dashed #E7E5DD', padding: '8px', borderRadius: '8px', background: '#FAF8F3' }}>
                                            <h5 style={{ margin: '0 0 4px', fontSize: '11px', color: '#6B7280', textTransform: 'uppercase' }}>Bank Details:</h5>
                                            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '4px', fontSize: '12px' }}>
                                                <span style={{ color: '#6B7280' }}>Account Name:</span><strong>VENTHULIR ORGANICS</strong>
                                                <span style={{ color: '#6B7280' }}>Bank Name:</span><strong>ICICI BANK</strong>
                                                <span style={{ color: '#6B7280' }}>Account No:</span><strong>000901031765</strong>
                                                <span style={{ color: '#6B7280' }}>IFSC Code:</span><strong>ICIC0000009</strong>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Side: Totals */}
                                    <div style={{ border: '1px solid #E7E5DD', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                                            <span>Taxable Amount:</span>
                                            <span>₹{overallGst.taxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                                            <span>GST ({gstRate}%):</span>
                                            <span>₹{overallGst.gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        {shipping > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280' }}>
                                                <span>Shipping Charges:</span>
                                                <span>₹{shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        {discount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#16A34A', fontWeight: 600 }}>
                                                <span>Discount:</span>
                                                <span>- ₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 800, color: '#0A2E1F', borderTop: '2px solid #E7E5DD', paddingTop: '6px', marginTop: '4px' }}>
                                            <span>Grand Total:</span>
                                            <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* 6. Signatures */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', paddingTop: '12px', borderTop: '1px solid #E7E5DD' }}>
                                    <div style={{ textAlign: 'center', width: '150px' }}>
                                        <div style={{ height: '20px' }}></div>
                                        <div style={{ borderTop: '1px solid #2F2F2F', paddingTop: '6px', fontSize: '12px', fontWeight: 600 }}>Customer Signature</div>
                                    </div>
                                    <div style={{ textAlign: 'center', width: '180px' }}>
                                        <div style={{ fontSize: '11px', color: '#6B7280', fontStyle: 'italic', marginBottom: '4px' }}>For Venthulir Organics</div>
                                        <div style={{ height: '16px' }}></div>
                                        <div style={{ borderTop: '1px solid #2F2F2F', paddingTop: '6px', fontSize: '12px', fontWeight: 600 }}>Authorized Signature</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Print / Download Button Footer (Hidden during print) */}
                        <div className="no-print" style={{ padding: '20px 40px', borderTop: '1px solid #E7E5DD', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#FAF8F3' }}>
                            <button
                                onClick={handlePrint}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: '1px solid #0A2E1F', background: '#FFFFFF', color: '#0A2E1F', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', borderRadius: '8px' }}
                            >
                                <Printer size={16} /> Print Invoice
                            </button>
                            <button
                                onClick={handleDownload}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', border: 'none', background: '#0A2E1F', color: '#FFFFFF', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', borderRadius: '8px' }}
                            >
                                <Download size={16} /> Download PDF
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
            {/* Print & Alignment Styling */}
            <style>{`
                .invoice-table th, .invoice-table td {
                    padding: 8px 10px !important;
                }
                .invoice-table .text-right {
                    text-align: right !important;
                    padding-right: 14px !important;
                }
                .invoice-table .text-center {
                    text-align: center !important;
                }
                .invoice-table .text-left {
                    text-align: left !important;
                }
                
                /* Mobile layout adjustments */
                @media (max-width: 640px) {
                    .invoice-header-row {
                        flex-direction: column !important;
                        align-items: flex-start !important;
                        gap: 16px !important;
                    }
                    .invoice-header-right-label {
                        text-align: left !important;
                    }
                    .invoice-info-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .invoice-info-grid > div:first-child {
                        border-right: none !important;
                        border-bottom: 1px solid #E7E5DD !important;
                    }
                    .invoice-modal-overlay {
                        padding: 8px !important;
                    }
                    .invoice-modal-content {
                        max-width: 100% !important;
                        border-radius: 12px !important;
                    }
                    .print-area {
                        padding: 12px 6px !important;
                    }
                    .print-area > div {
                        padding: 12px 10px !important;
                        border-radius: 8px !important;
                    }
                    .invoice-bottom-grid {
                        grid-template-columns: 1fr !important;
                        gap: 16px !important;
                    }
                }

                @media print {
                    /* Hide EVERYTHING on the page except the invoice modal overlay */
                    body > *:not(.invoice-modal-overlay), 
                    #root > *:not(.invoice-modal-overlay) {
                        display: none !important;
                    }
                    .invoice-modal-overlay {
                        background: none !important;
                        backdrop-filter: none !important;
                        position: static !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        display: block !important;
                    }
                    .invoice-modal-content {
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                        max-width: 100% !important;
                        width: 100% !important;
                        position: static !important;
                        transform: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .print-area, .print-area * {
                        visibility: visible !important;
                    }
                    .print-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </AnimatePresence>
    );
};

export default InvoiceModal;
