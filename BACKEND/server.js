const express = require('express');
const path = require('path');
require('dotenv').config({path: path.join(__dirname, '.env')});
const connectDB = require('./db.js');
const router = require('./routes/api.js');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', router);

app.use('/css', express.static(path.join(__dirname, '../FRONTEND/css')));
app.use('/js', express.static(path.join(__dirname, '../FRONTEND/js')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

connectDB().then(() =>
{
    app.listen(PORT, () => console.log(`Attenbee corriendo en puerto ${PORT}`));
}).catch(err =>
{
    console.error("Error entrando a MongoDB: ", err.message);
    process.exit(1);
})