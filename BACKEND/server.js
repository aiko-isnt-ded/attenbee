const express = require('express');
const path = require('path');
const router = require('./routes/api.js');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use('/', router);

app.use('/css', express.static(path.join(__dirname, '../FRONTEND/css')));
app.use('/js', express.static(path.join(__dirname, '../FRONTEND/js')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));

app.listen(PORT, () =>
{
    console.log(`Proyecto Final corriendo en puerto ${PORT}`);
});