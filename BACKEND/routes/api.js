const express = require('express');
const path = require('path');

const userRoutes = require('./users');

const routerApi = express.Router();

routerApi.use('/users', userRoutes);

// Mounting views

routerApi.get("/", (req, res) =>
{
    if (req.get('x-auth'))
    {
        res.sendFile(path.resolve(__dirname + "../../../FRONTEND/pages/home.html"));
    } else
    {
        res.sendFile(path.resolve(__dirname + "../../../FRONTEND/pages/login.html"));
    }
});

routerApi.get("/home.html", (req, res) => {
    res.sendFile(path.resolve(__dirname + "../../../FRONTEND/pages/home.html"));
});

routerApi.get("/login.html", (req, res) => {
    res.sendFile(path.resolve(__dirname + "../../../FRONTEND/pages/login.html"));
});

routerApi.get("/tasks.html", (req, res) => {
    res.sendFile(path.resolve(__dirname + "../../../FRONTEND/pages/tasks.html"));
});

module.exports = routerApi;