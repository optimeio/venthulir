const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyAndPlaceOrder } = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// All payment routes require authentication
router.use(auth);

// Step 1: Create a Razorpay order (returns order id + amount for frontend modal)
router.post('/create-order', createRazorpayOrder);

// Step 2: Verify payment signature and save order to DB
router.post('/verify', verifyAndPlaceOrder);

module.exports = router;
