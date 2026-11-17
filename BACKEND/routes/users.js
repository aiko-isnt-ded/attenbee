const express = require('express');
const userController = require('../controllers/user_api_controller');
const routerUsers = express.Router();

routerUsers.put('/change-password', userController.changeUserPassword);

routerUsers.post('/login', userController.loginUser);

module.exports = routerUsers;