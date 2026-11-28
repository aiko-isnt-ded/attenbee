const express = require('express');
const productController = require('../controllers/product_api_controller');
const routerProducts = express.Router();
const upload = require('../middleware/upload');

routerProducts.get('/', productController.loadProducts);
routerProducts.put('/:product_id', upload, productController.editProduct);
routerProducts.post('/', upload, productController.createProduct);
routerProducts.delete('/:product_id', productController.deleteProduct);

module.exports = routerProducts;