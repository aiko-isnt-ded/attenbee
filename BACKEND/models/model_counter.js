// Existe para hacer más segura la creación de IDs autoincrementados por orders
const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({_id: String, seq: {type: Number, default: 0}});

module.exports = mongoose.model('Counter', counterSchema);