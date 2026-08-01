const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
    productCode: {
        type: String,
        unique: true,
        // Auto-generated as VNT-XXXXXX if not provided
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String, required: true },
    hsnSac: { type: String, default: "" },
    slug: { type: String, unique: true },
    imageUrl: { type: String },
    images: { type: [String], default: [] },
    category: { type: String, default: "General" },
    badge: { type: String, default: "" },
    shippingCharge: { type: Number, default: 0 },
    originalPrice: { type: Number }, // To store manual MRP if desired
    discountPercent: { type: Number }, // To store manual discount % if desired
    variants: [{
        label:    { type: String, required: true },
        price:    { type: Number, required: true },
        contents: { type: String, default: '' }   // e.g. "Turmeric 100g + Chilli 200g + Coriander 150g"
    }],
    comboContents: [{
        item:   { type: String, required: true },  // e.g. "Turmeric Powder"
        weight: { type: String, required: true }   // e.g. "100g"
    }],
    initialStock: { type: Number, default: 0, min: 0 },
    currentStock: { type: Number, default: 0, min: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Auto-generate productCode and handle illusion dates
ProductSchema.pre('save', async function (next) {
    this.updatedAt = new Date();

    if (!this.productCode) {
        const randomPart = Math.floor(100000 + Math.random() * 900000); // 6-digit number
        this.productCode = `VNT-${randomPart}`;
    }

    if (this.isModified('name') || !this.slug) {
        let baseSlug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const suffix = this.productCode.replace('VNT-', '').toLowerCase();
        this.slug = `${baseSlug}-${suffix}`;
    }
    next();
});

module.exports = mongoose.model('Product', ProductSchema, 'ProductDetails');
