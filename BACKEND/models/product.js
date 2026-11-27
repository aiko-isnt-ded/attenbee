const mongoose = require('mongoose');

const productSchema = new mongoose.Schema
({
    product_id: {type: String, required: true, unique: true},
    image: {type: String, default: ''},
    product_name: {type: String, required: true},
    category: 
    {
        type: String,
        enum: ['cafe', 'te', 'panaderia', 'otros'],
        required: true
    },
    price: {type: Number, required: true},
    total_units: {type: Number, default: null},
    temperature: {type: String, enum: ['hot', 'cold'], default: null}
});

module.exports = mongoose.model('Product', productSchema);