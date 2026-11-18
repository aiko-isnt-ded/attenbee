const express = require('express');
const orderController = require('../controllers/order_api_controller');
const routerOrders = express.Router();

routerOrders.post('/', orderController.createOrder);
routerOrders.get('/:order_id', orderController.getOrderWithItems);
routerOrders.post('/items', orderController.addItemToOrder);
routerOrders.delete('/items/:item_id', orderController.removeItem);

module.exports = routerOrders;