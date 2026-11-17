const express = require('express');
const productController = require('../controllers/product_api_controller');
const routerProducts = express.Router();

routerProducts.get('/', productController.loadProducts);

routerProducts.put('/:product_id', productController.editProduct);

routerProducts.post('/', productController.createProduct);

routerProducts.delete('/:product_id', productController.deleteProduct);

module.exports = routerProducts;