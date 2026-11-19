const express = require('express');
const orderController = require('../controllers/order_api_controller');
const routerOrders = express.Router();

routerOrders.post('/', orderController.createOrder);
routerOrders.get('/summary', orderController.getDaySummary);
routerOrders.get('/:order_id', orderController.getOrderWithItems);
routerOrders.post('/items', orderController.addItemToOrder);
routerOrders.delete('/items/:item_id', orderController.removeItem);
routerOrders.get('/', orderController.getOpenOrders);
routerOrders.post("/:order_id/payments", orderController.addPayment);
routerOrders.post('/:order_id/close', orderController.closeOrder);

module.exports = routerOrders;