const fs = require('fs');
const path = require('path');
const googleSheets = require('../services/googleSheets');
const tracking = require('../services/tracking');

const ORDERS_FILE = path.join(__dirname, '..', 'data', 'orders.json');

function getOrdersFromFile() {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8') || '[]');
    }
  } catch (err) {
    console.error('Error reading orders file:', err);
  }
  return [];
}

function saveOrdersToFile(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing orders file:', err);
    return false;
  }
}

function normalizePhoneNumber(phone) {
  if (!phone) return '';
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, '');
  // Remove leading 00 if any
  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }
  // If it starts with 213, remove it
  if (cleaned.startsWith('213') && cleaned.length > 8) {
    cleaned = cleaned.substring(3);
  }
  // Remove leading 0 if any
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
}

// POST /api/orders
exports.createOrder = async (req, res) => {
  try {
    const orders = getOrdersFromFile();

    const orderId = req.body.id || 'ZF-' + Math.floor(1000 + Math.random() * 9000);
    const dateStr = req.body.date || new Date().toLocaleDateString('ar-DZ', { year: 'numeric', month: '2-digit', day: '2-digit' });

    const phoneClean = normalizePhoneNumber(req.body.phone);
    const productClean = (req.body.product || '').trim();
    const duplicateWindow = 24 * 60 * 60 * 1000; // 24 hours

    const isDuplicate = orders.find(o => {
      const storedPhone = normalizePhoneNumber(o.phone);
      const isSamePhone = storedPhone === phoneClean && phoneClean !== '';
      const isSameProduct = (o.product || '').trim() === productClean;
      
      let isRecent = false;
      if (o.timestamp) {
        isRecent = Date.now() - o.timestamp < duplicateWindow;
      } else if (o.date) {
        isRecent = o.date === dateStr;
      }
      return isSamePhone && isSameProduct && isRecent;
    });

    if (isDuplicate) {
      console.warn(`⚠️ Duplicate order detected from ${req.body.phone} for "${req.body.product}". Skipping storage and integrations.`);
      return res.status(200).json({ success: true, duplicate: true, order: isDuplicate });
    }

    const newOrder = {
      id: orderId.replace('#', ''),
      name: req.body.name,
      phone: req.body.phone,
      wilaya: req.body.wilaya,
      commune: req.body.commune || '',
      address: req.body.address || '',
      product: req.body.product,
      variant: req.body.variant || '',
      quantity: Number(req.body.quantity) || 1,
      amount: Number(req.body.amount) || 0,
      status: req.body.status || 'pending',
      date: dateStr,
      timestamp: Date.now(),
      source: req.body.source || 'Direct',
      utm: req.body.utm || '',
      pixelEventId: req.body.pixelEventId || `ZF-EV-${orderId}`,
      sourceUrl: req.headers.referer || '',
      userAgent: req.headers['user-agent'] || '',
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || ''
    };

    orders.unshift(newOrder);
    saveOrdersToFile(orders);

    // Run integrations in the background
    googleSheets.syncOrder(newOrder).catch(err => console.error('Google Sheets async err:', err));
    tracking.fireServerEvent('Purchase', newOrder).catch(err => console.error('CAPI Event async err:', err));

    res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    console.error('Create Order Controller Error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

// GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const orders = getOrdersFromFile();
    
    // Pagination & Search
    const search = (req.query.search || '').toLowerCase();
    const status = req.query.status || 'all';
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    let filtered = orders;

    if (status !== 'all') {
      filtered = filtered.filter(o => o.status === status);
    }

    if (search) {
      filtered = filtered.filter(o => 
        o.id.toLowerCase().includes(search) ||
        o.name.toLowerCase().includes(search) ||
        o.phone.toLowerCase().includes(search) ||
        o.wilaya.toLowerCase().includes(search)
      );
    }

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.status(200).json({
      orders: paginated,
      total: filtered.length,
      page,
      pages: Math.ceil(filtered.length / limit)
    });
  } catch (err) {
    console.error('Get Orders Controller Error:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
};

// PUT /api/orders/:id
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orders = getOrdersFromFile();
    const index = orders.findIndex(o => o.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = { ...orders[index], ...req.body };
    orders[index] = updated;

    saveOrdersToFile(orders);
    res.status(200).json({ success: true, order: updated });
  } catch (err) {
    console.error('Update Order Controller Error:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
};

// DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let orders = getOrdersFromFile();
    const exists = orders.some(o => o.id === id);

    if (!exists) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders = orders.filter(o => o.id !== id);
    saveOrdersToFile(orders);

    res.status(200).json({ success: true, message: 'Order deleted successfully' });
  } catch (err) {
    console.error('Delete Order Controller Error:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
};
