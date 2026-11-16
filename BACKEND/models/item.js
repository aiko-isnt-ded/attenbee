const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema
({
    item_id: {type: String, required: true},
    order_id: {type: String, required: true},
    product_id: {type: String, required: true},
    qty: {type: Number, required: true, min: 1},
    total_price: {type: Number, required: true},
    details: 
    {
        type: String,
        enum: ["PA", "PL", "TP", "CJE", "CE", "CL", "N", "MI", "SP", "AM"]
    }
});

