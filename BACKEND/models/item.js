const mongoose = require('mongoose');
const crypto = require('crypto');

const itemSchema = new mongoose.Schema
({
    item_id: {type: String, required: true, unique: true, default: () => crypto.randomUUID()},
    order_id: {type: Number, required: true, index: true},
    product_id: {type: String, required: true},
    qty: {type: Number, required: true, min: 1},
    total_price: {type: Number, required: true},
    details: 
    {
        type: [{type: String, enum: ["PA", "PL", "TP", "CJE", "CE", "CL", "N", "MI", "SP", "AM"]}],
        default: [] 
    }
});

module.exports = mongoose.model('Item', itemSchema);