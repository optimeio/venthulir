import React from 'react';
import { ShoppingBag, Package, Truck, Check, MapPin, Calendar, Clock, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import './OrderTracking.css';

const OrderTracking = ({ status = 'Shipped', order = null }) => {
    const baseDate = order?.createdAt ? new Date(order.createdAt) : new Date();

    const getFormattedDate = (daysToAdd = 0) => {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + daysToAdd);
        return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const getDeliveryDate = () => {
        if (!order) return 'TBD';
        if (order.status === 'Delivered' && order.statusUpdatedAt) {
            return new Date(order.statusUpdatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        return getFormattedDate(3);
    };

    const getHub = () => {
        if (order?.status === 'Delivered') return 'Delivered to Customer';
        if (order?.status === 'Cancelled') return 'Order Cancelled';
        return 'Salem Venthulir Reserve';
    };

    const getTrackingId = () => {
        if (!order) return 'VTLR00000000IN';
        const rawId = order._id || order.id || 'default';
        return `VTLR${String(rawId).slice(-8).toUpperCase()}IN`;
    };

    const steps = [
        { 
            name: 'Ordered', 
            icon: <ShoppingBag size={20} />, 
            date: getFormattedDate(0),
            time: '10:24 AM'
        },
        { 
            name: 'Shipped', 
            icon: <Package size={20} />, 
            date: getFormattedDate(1),
            time: '04:30 PM'
        },
        { 
            name: 'On the Way', 
            icon: <Truck size={20} />, 
            date: getFormattedDate(2),
            time: '09:10 AM'
        },
        { 
            name: 'Delivered', 
            icon: <Check size={20} />, 
            date: order?.status === 'Delivered' ? getDeliveryDate() : getFormattedDate(3),
            time: '--:-- --'
        }
    ];

    const statusMap = {
        'Pending': 0,
        'Processing': 0,
        'Ordered': 0,
        'Shipped': 1,
        'On the Way': 2,
        'Delivered': 3,
        'Cancelled': -1
    };

    const currentStepIndex = statusMap[status] !== undefined ? statusMap[status] : 1;

    // Progress bar calculation
    const progressWidth = currentStepIndex >= 0 
        ? `${(currentStepIndex / (steps.length - 1)) * 100}%` 
        : '0%';

    return (
        <div className="ot-container">
            {/* Timeline Progress */}
            <div className="ot-timeline">
                <div className="ot-progress-line-bg">
                    <motion.div 
                        className="ot-progress-line-active" 
                        initial={{ width: 0 }}
                        animate={{ width: progressWidth }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                    />
                </div>

                {steps.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isUpcoming = index > currentStepIndex;

                    let stepClass = 'upcoming';
                    if (isCompleted) stepClass = 'completed';
                    if (isCurrent) stepClass = 'current';

                    if (status === 'Cancelled') {
                        stepClass = 'upcoming';
                    }

                    return (
                        <div key={step.name} className={`ot-step ${stepClass}`}>
                            <div className="ot-circle-wrap">
                                <div className="ot-circle">
                                    {step.icon}
                                </div>
                                {isCompleted && (
                                    <div className="ot-check-badge">
                                        <Check size={10} strokeWidth={3} />
                                    </div>
                                )}
                            </div>
                            <div className="ot-step-details">
                                <div className="ot-step-title">{step.name}</div>
                                <div className="ot-step-date">
                                    {status === 'Cancelled' ? '--' : (isUpcoming ? '-- --' : step.date)}
                                </div>
                                <div className="ot-step-time">
                                    {status === 'Cancelled' ? '--' : (isUpcoming ? '--:-- --' : step.time)}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Premium Horizontal Info Row */}
            <div className="ot-info-row">
                <div className="ot-info-col">
                    <MapPin size={18} className="ot-card-icon" />
                    <div className="ot-card-details">
                        <span className="ot-card-title">Current Hub</span>
                        <span className="ot-card-val">{getHub()}</span>
                    </div>
                </div>

                <div className="ot-info-col">
                    <Calendar size={18} className="ot-card-icon" />
                    <div className="ot-card-details">
                        <span className="ot-card-title">Est. Delivery</span>
                        <span className="ot-card-val">{getDeliveryDate()}</span>
                    </div>
                </div>

                <div className="ot-info-col">
                    <Clock size={18} className="ot-card-icon" />
                    <div className="ot-card-details">
                        <span className="ot-card-title">Last Updated</span>
                        <span className="ot-card-val">{getFormattedDate(currentStepIndex >= 0 ? currentStepIndex : 0)}, 09:10 AM</span>
                    </div>
                </div>

                <div className="ot-info-col">
                    <BarChart3 size={18} className="ot-card-icon" />
                    <div className="ot-card-details">
                        <span className="ot-card-title">Tracking ID</span>
                        <span className="ot-card-val" style={{ fontFamily: 'monospace' }}>{getTrackingId()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderTracking;
