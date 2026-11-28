// Script usado para pasar el user actual a la nueva base de datos de MongoDB, solo se corrió una vez, se deja aquí para la posteridad.

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const fs = require('fs').promises;
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('../db');
const User = require('../models/user');

(async () =>
{
    await connectDB();

    const users = JSON.parse(await fs.readFile(path.join(__dirname, '../data/users.json'), 'utf8'));
    if (!users[0]) throw new Error('users.json no tiene ningún usuario');

    await User.deleteMany({});
    await User.create
    ({
        name: users[0].name || 'Colmena',
        password: await bcrypt.hash(users[0].password, 10)
    });

    console.log('Usuario creado con contraseña hasheada');
    await mongoose.disconnect();
})().catch(err => { console.error(err); process.exit(1); });