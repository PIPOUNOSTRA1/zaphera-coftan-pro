exports.validateOrder = (req, res, next) => {
  const { name, phone, wilaya, product, amount } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Name is required and must be at least 2 characters' });
  }
  if (!phone || typeof phone !== 'string') {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const phoneRegex = /^(05|06|07)[0-9]{8}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return res.status(400).json({ error: 'Invalid Algerian phone number format' });
  }
  if (!wilaya || typeof wilaya !== 'string' || wilaya.trim().length === 0) {
    return res.status(400).json({ error: 'Wilaya is required' });
  }
  if (!product || typeof product !== 'string') {
    return res.status(400).json({ error: 'Product detail is required' });
  }
  if (amount === undefined || typeof amount !== 'number' || amount < 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  // Sanitize
  req.body.name = name.trim();
  req.body.phone = cleanPhone;
  req.body.wilaya = wilaya.trim();
  if (req.body.commune) req.body.commune = req.body.commune.trim();
  if (req.body.address) req.body.address = req.body.address.trim();
  
  next();
};

exports.validateOrderUpdate = (req, res, next) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }
  next();
};
