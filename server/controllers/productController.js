const Product = require('../models/Product');

// Fields to EXCLUDE from customer-facing responses
const STOCK_FIELDS_EXCLUDE = '-initialStock -currentStock -updatedAt';

// Extremely Fast In-Memory Cache (Speeds up load times by 10x)
let productsCache = { data: null, timestamp: 0 };
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes

exports.clearProductsCache = () => {
    productsCache = { data: null, timestamp: 0 };
};

exports.getProducts = async (req, res) => {
    try {
        const { category, search, badge, page = 1, limit = 12 } = req.query;
        let query = {};

        // Use full cache only if it's a generic first-page load (the heaviest one!)
        const isGenericQuery = (!category || category === 'All') && !search && !badge && page == 1 && limit == 12;

        if (isGenericQuery && Date.now() - productsCache.timestamp < CACHE_LIFETIME && productsCache.data) {
            return res.json(productsCache.data);
        }

        if (category && category !== 'All') query.category = category;
        if (search) query.name = { $regex: search, $options: 'i' };

        if (badge === 'New Arrival') {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            query.$or = [
                { badge: 'New Arrival' },
                { createdAt: { $gte: thirtyDaysAgo } }
            ];
        } else if (badge) {
            query.badge = badge;
        }

        const products = await Product.find(query)
            .select(STOCK_FIELDS_EXCLUDE)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const count = await Product.countDocuments(query);

        // Auto-fix image URLs for the current domain
        const currentDomain = `${req.protocol}://${req.get('host')}`;
        const fixedProducts = products.map(p => {
            const product = p.toObject();
            if (product.imageUrl && typeof product.imageUrl === 'string' && (product.imageUrl.includes('onrender.com') || product.imageUrl.includes('localhost:7000'))) {
                product.imageUrl = product.imageUrl.replace(/https?:\/\/[^/]+/, currentDomain);
            }
            if (product.images) {
                product.images = product.images.map(img => (img && typeof img === 'string' && (img.includes('onrender.com') || img.includes('localhost:7000'))) ? img.replace(/https?:\/\/[^/]+/, currentDomain) : img);
            }
            return product;
        });

        const responseData = {
            products: fixedProducts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            totalItems: count
        };

        // Save to cache if it's the generic load
        if (isGenericQuery) {
            productsCache = { data: responseData, timestamp: Date.now() };
        }

        res.json(responseData);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const id = req.params.id;
        const query = /^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { slug: id };
        const p = await Product.findOne(query).select(STOCK_FIELDS_EXCLUDE);
        if (!p) return res.status(404).json({ msg: 'Product not found' });
        
        const product = p.toObject();
        const currentDomain = `${req.protocol}://${req.get('host')}`;
        if (product.imageUrl && typeof product.imageUrl === 'string' && (product.imageUrl.includes('onrender.com') || product.imageUrl.includes('localhost:7000'))) {
            product.imageUrl = product.imageUrl.replace(/https?:\/\/[^/]+/, currentDomain);
        }
        if (product.images) {
            product.images = product.images.map(img => (img && typeof img === 'string' && (img.includes('onrender.com') || img.includes('localhost:7000'))) ? img.replace(/https?:\/\/[^/]+/, currentDomain) : img);
        }
        
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: 'Server Error' });
    }
};

exports.getSitemap = async (req, res) => {
    try {
        const products = await Product.find({}).select('_id updatedAt');

        // Build XML
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        // Core Pages
        const corePages = ['/', '/all-products', '/new-arrivals'];
        corePages.forEach(page => {
            xml += `  <url>\n    <loc>https://venthulir.com${page}</loc>\n    <priority>1.0</priority>\n  </url>\n`;
        });

        // Dynamic Product Pages
        products.forEach(product => {
            const date = product.updatedAt ? product.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            xml += `  <url>\n`;
            xml += `    <loc>https://venthulir.com/product/${product._id}</loc>\n`;
            xml += `    <lastmod>${date}</lastmod>\n`;
            xml += `    <priority>0.8</priority>\n`;
            xml += `  </url>\n`;
        });

        xml += `</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        res.status(500).send('Error generating sitemap');
    }
};
