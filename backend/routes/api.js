const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const dashController = require('../controllers/dashController');
const validation = require('../middleware/validation');

// Orders endpoints
router.post('/orders', validation.validateOrder, orderController.createOrder);
router.get('/orders', orderController.getOrders);
router.put('/orders/:id', validation.validateOrderUpdate, orderController.updateOrder);
router.delete('/orders/:id', orderController.deleteOrder);

// Dashboard & Stats endpoints
router.get('/dashboard', dashController.getDashboardStats);
router.get('/products', dashController.getProducts);
router.get('/customers', dashController.getCustomers);
router.get('/statistics', dashController.getStatistics);

// Analytics traffic tracking
router.post('/visit', dashController.trackVisit);

module.exports = router;
