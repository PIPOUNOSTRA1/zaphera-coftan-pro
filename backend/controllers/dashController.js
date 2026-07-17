const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');
const VISITS_FILE = path.join(__dirname, '..', 'data', 'visits.json');

const MASTER_PRODUCTS = [
  { id: '1', emoji: '👘', name: 'القفطان الملكي الذهبي', price: 18500, stock: 'in', stockLabel: 'متوفر' },
  { id: '2', emoji: '🌸', name: 'كراكو السهرة الفضي', price: 12000, stock: 'in', stockLabel: 'متوفر' },
  { id: '3', emoji: '💍', name: 'فستان الزفاف الأبيض', price: 35000, stock: 'low', stockLabel: 'مخزون منخفض' },
  { id: '4', emoji: '🌙', name: 'القفطان الأسود المطرز', price: 22000, stock: 'in', stockLabel: 'متوفر' },
  { id: '5', emoji: '✨', name: 'كراكو التراث الجزائري', price: 9800, stock: 'in', stockLabel: 'متوفر' },
  { id: '6', emoji: '🌺', name: 'قفطان الربيع المنقوش', price: 14500, stock: 'low', stockLabel: 'مخزون منخفض' },
  { id: '7', emoji: '👑', name: 'القفطان الإمبراطوري', price: 45000, stock: 'in', stockLabel: 'متوفر' },
  { id: '8', emoji: '🌟', name: 'كراكو الليلة البيضاء', price: 16800, stock: 'out', stockLabel: 'نفد المخزون' }
];

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');

function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      return JSON.parse(fs.readFileSync(PRODUCTS_FILE, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('Error reading products file:', err);
  }
  return [];
}

function saveProducts(products) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing products file:', err);
    return false;
  }
}

function getOrders() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('Error reading orders:', err);
  }
  return [];
}

function getVisits() {
  try {
    if (fs.existsSync(VISITS_FILE)) {
      const data = JSON.parse(fs.readFileSync(VISITS_FILE, 'utf8') || '{}');
      return data.total || 0;
    }
  } catch (err) {
    console.error('Error reading visits:', err);
  }
  return 0;
}

// POST /api/visit
exports.trackVisit = async (req, res) => {
  try {
    let total = 0;
    if (fs.existsSync(VISITS_FILE)) {
      const data = JSON.parse(fs.readFileSync(VISITS_FILE, 'utf8') || '{}');
      total = data.total || 0;
    }
    total += 1;
    fs.writeFileSync(VISITS_FILE, JSON.stringify({ total }), 'utf8');
    res.status(200).json({ success: true, visits: total });
  } catch (err) {
    console.error('Track Visit Error:', err);
    res.status(500).json({ error: 'Failed to record visit' });
  }
};

// GET /api/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const orders = getOrders();
    const visits = getVisits();

    const totalOrders = orders.length;
    
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    const revenue = activeOrders.reduce((sum, o) => sum + Number(o.amount), 0);

    const conversionRate = visits > 0 ? (totalOrders / visits) * 100 : 0;

    const confirmedCount = orders.filter(o => ['confirmed', 'shipped', 'delivered'].includes(o.status)).length;
    const confirmationRate = totalOrders > 0 ? (confirmedCount / totalOrders) * 100 : 0;

    const shippedOrDelivered = orders.filter(o => ['shipped', 'delivered'].includes(o.status)).length;
    const deliveredCount = orders.filter(o => o.status === 'delivered').length;
    const deliveryRate = shippedOrDelivered > 0 ? (deliveredCount / shippedOrDelivered) * 100 : 0;

    const aov = totalOrders > 0 ? revenue / totalOrders : 0;

    const productStats = {};
    orders.forEach(o => {
      const items = o.product.split(' + ');
      items.forEach(item => {
        const cleanItem = item.replace(/\(x\d+\)/g, '').trim();
        const quantityMatch = item.match(/\(x(\d+)\)/);
        const qty = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
        
        productStats[cleanItem] = (productStats[cleanItem] || 0) + qty;
      });
    });

    const productsList = loadProducts();
    const bestProducts = Object.entries(productStats)
      .map(([name, sold]) => {
        const prodInfo = productsList.find(p => p.name === name) || {};
        return {
          name,
          sold,
          revenue: sold * (prodInfo.price || 0),
          emoji: prodInfo.emoji || '👘'
        };
      })
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);

    const wilayaStats = {};
    orders.forEach(o => {
      const cleanW = o.wilaya.trim();
      wilayaStats[cleanW] = (wilayaStats[cleanW] || 0) + 1;
    });
    const bestWilayas = Object.entries(wilayaStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const customerStats = {};
    orders.forEach(o => {
      const key = `${o.phone}_${o.name}`;
      if (!customerStats[key]) {
        customerStats[key] = { name: o.name, phone: o.phone, ordersCount: 0, totalSpent: 0 };
      }
      customerStats[key].ordersCount += 1;
      customerStats[key].totalSpent += Number(o.amount);
    });
    const bestCustomers = Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    const recentActivity = orders.slice(0, 10).map(o => ({
      id: o.id,
      name: o.name,
      product: o.product,
      amount: o.amount,
      status: o.status,
      date: o.date
    }));

    res.status(200).json({
      revenue,
      totalOrders,
      visits,
      conversionRate,
      confirmationRate,
      deliveryRate,
      aov,
      bestProducts,
      bestWilayas,
      bestCustomers,
      recentActivity
    });
  } catch (err) {
    console.error('Get Dashboard Stats Error:', err);
    res.status(500).json({ error: 'Failed to compute dashboard statistics' });
  }
};

// GET /api/products
exports.getProducts = async (req, res) => {
  try {
    const orders = getOrders();
    const productStats = {};
    
    orders.forEach(o => {
      const items = o.product.split(' + ');
      items.forEach(item => {
        const cleanItem = item.replace(/\(x\d+\)/g, '').trim();
        const quantityMatch = item.match(/\(x(\d+)\)/);
        const qty = quantityMatch ? parseInt(quantityMatch[1], 10) : 1;
        productStats[cleanItem] = (productStats[cleanItem] || 0) + qty;
      });
    });

    const products = loadProducts().map(p => ({
      ...p,
      sold: productStats[p.name] || 0
    }));

    res.status(200).json(products);
  } catch (err) {
    console.error('Get Products Error:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
};

// POST /api/products
exports.addProduct = async (req, res) => {
  try {
    const products = loadProducts();
    const newProduct = req.body;
    
    if (!newProduct.name || !newProduct.price) {
      return res.status(400).json({ error: 'Name and Price are required' });
    }
    
    if (!newProduct.id) {
      newProduct.id = 'prod-' + Date.now();
    }
    
    if (products.some(p => p.id === newProduct.id)) {
      return res.status(400).json({ error: 'Product ID already exists' });
    }
    
    const productToAdd = {
      id: newProduct.id,
      name: newProduct.name,
      name_fr: newProduct.name_fr || newProduct.name,
      sku: newProduct.sku || 'SKU-' + Math.floor(10000 + Math.random() * 90000),
      slug: newProduct.slug || newProduct.id,
      price: Number(newProduct.price),
      oldPrice: newProduct.oldPrice ? Number(newProduct.oldPrice) : null,
      cost: newProduct.cost ? Number(newProduct.cost) : 0,
      priority: newProduct.priority ? Number(newProduct.priority) : 0,
      tag: newProduct.tag || null,
      tag_fr: newProduct.tag_fr || null,
      image: newProduct.image || 'assets/caftan-zahia.png',
      images: Array.isArray(newProduct.images) ? newProduct.images : [],
      grids: Array.isArray(newProduct.grids) ? newProduct.grids : ['grid-new'],
      desc: newProduct.desc || '',
      desc_fr: newProduct.desc_fr || '',
      pixelType: newProduct.pixelType || 'none',
      pixelId: newProduct.pixelId || '',
      isLandingPage: !!newProduct.isLandingPage,
      isDigital: !!newProduct.isDigital,
      digitalCode: newProduct.digitalCode || '',
      fakeViewers: newProduct.fakeViewers ? Number(newProduct.fakeViewers) : 12,
      fakeOrders: newProduct.fakeOrders ? Number(newProduct.fakeOrders) : 248
    };
    
    products.push(productToAdd);
    saveProducts(products);
    
    res.status(201).json({ success: true, product: productToAdd });
  } catch (err) {
    console.error('Add Product Error:', err);
    res.status(500).json({ error: 'Failed to add product' });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const products = loadProducts();
    const prodId = req.params.id;
    const index = products.findIndex(p => p.id === prodId);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const updatedData = req.body;
    
    products[index] = {
      ...products[index],
      name: updatedData.name || products[index].name,
      name_fr: updatedData.name_fr || products[index].name_fr,
      sku: updatedData.sku !== undefined ? updatedData.sku : products[index].sku,
      slug: updatedData.slug !== undefined ? updatedData.slug : products[index].slug,
      price: updatedData.price !== undefined ? Number(updatedData.price) : products[index].price,
      oldPrice: updatedData.oldPrice !== undefined ? (updatedData.oldPrice ? Number(updatedData.oldPrice) : null) : products[index].oldPrice,
      cost: updatedData.cost !== undefined ? Number(updatedData.cost) : (products[index].cost || 0),
      priority: updatedData.priority !== undefined ? Number(updatedData.priority) : (products[index].priority || 0),
      tag: updatedData.tag !== undefined ? (updatedData.tag || null) : products[index].tag,
      tag_fr: updatedData.tag_fr !== undefined ? (updatedData.tag_fr || null) : products[index].tag_fr,
      image: updatedData.image || products[index].image,
      images: Array.isArray(updatedData.images) ? updatedData.images : products[index].images,
      grids: Array.isArray(updatedData.grids) ? updatedData.grids : products[index].grids,
      desc: updatedData.desc !== undefined ? updatedData.desc : products[index].desc,
      desc_fr: updatedData.desc_fr !== undefined ? updatedData.desc_fr : products[index].desc_fr,
      pixelType: updatedData.pixelType !== undefined ? updatedData.pixelType : (products[index].pixelType || 'none'),
      pixelId: updatedData.pixelId !== undefined ? updatedData.pixelId : (products[index].pixelId || ''),
      isLandingPage: updatedData.isLandingPage !== undefined ? !!updatedData.isLandingPage : products[index].isLandingPage,
      isDigital: updatedData.isDigital !== undefined ? !!updatedData.isDigital : products[index].isDigital,
      digitalCode: updatedData.digitalCode !== undefined ? updatedData.digitalCode : (products[index].digitalCode || ''),
      fakeViewers: updatedData.fakeViewers !== undefined ? Number(updatedData.fakeViewers) : (products[index].fakeViewers || 12),
      fakeOrders: updatedData.fakeOrders !== undefined ? Number(updatedData.fakeOrders) : (products[index].fakeOrders || 248)
    };
    
    saveProducts(products);
    
    res.status(200).json({ success: true, product: products[index] });
  } catch (err) {
    console.error('Update Product Error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const products = loadProducts();
    const prodId = req.params.id;
    const initialLength = products.length;
    const filtered = products.filter(p => p.id !== prodId);
    
    if (filtered.length === initialLength) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    saveProducts(filtered);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete Product Error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

// GET /api/customers
exports.getCustomers = async (req, res) => {
  try {
    const orders = getOrders();
    const customerMap = {};

    orders.forEach(o => {
      const phone = o.phone;
      if (!customerMap[phone]) {
        customerMap[phone] = {
          name: o.name,
          phone: o.phone,
          wilaya: o.wilaya,
          ordersCount: 0,
          totalSpent: 0,
          lastOrderDate: o.date
        };
      }
      customerMap[phone].ordersCount += 1;
      customerMap[phone].totalSpent += Number(o.amount);
    });

    res.status(200).json(Object.values(customerMap));
  } catch (err) {
    console.error('Get Customers Error:', err);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
};

// GET /api/statistics
exports.getStatistics = async (req, res) => {
  try {
    const orders = getOrders();

    const dateStats = {};
    orders.forEach(o => {
      const date = o.date;
      if (!dateStats[date]) {
        dateStats[date] = { date, orders: 0, revenue: 0 };
      }
      dateStats[date].orders += 1;
      if (o.status !== 'cancelled') {
        dateStats[date].revenue += Number(o.amount);
      }
    });

    const sortedStats = Object.values(dateStats).sort((a, b) => {
      const parseDate = str => {
        const parts = str.split('/');
        return new Date(parts[2], parts[1] - 1, parts[0]);
      };
      return parseDate(a.date) - parseDate(b.date);
    });

    res.status(200).json(sortedStats);
  } catch (err) {
    console.error('Get Statistics Error:', err);
    res.status(500).json({ error: 'Failed to retrieve raw statistics' });
  }
};
