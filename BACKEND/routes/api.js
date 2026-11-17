const express = require('express');
const path = require('path');

const userRoutes = require('./users');
const productRoutes = require('./products');

const routerApi = express.Router();

routerApi.use('/users', userRoutes);
routerApi.use('/products', productRoutes);

// Mounting views

routerApi.get("/", (req, res) =>
{
        res.send(`
            <!DOCTYPE html>
            <html lang="es">
            <head><meta charset="utf-8"><title>Colmena Café</title></head>
            <body>
                <script>
                    const isAuth = localStorage.getItem('isAuth');
                    if (isAuth === 'true') {
                        window.location.href = '/main.html';
                    } else {
                        window.location.href = '/login.html';
                    }
                </script>
            </body>
            </html>
        `);
});

routerApi.get("/main.html", (req, res) => {
    res.sendFile(path.resolve(__dirname + "../../../FRONTEND/pages/main.html"));
});

routerApi.get("/login.html", (req, res) => {
    res.sendFile(path.resolve(__dirname + "../../../FRONTEND/pages/login.html"));
});

routerApi.get("/products.html", (req, res) => {
    res.sendFile(path.resolve(__dirname + "../../../FRONTEND/pages/products.html"));
});

module.exports = routerApi;