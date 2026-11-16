const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema
({
    order_id: {type: Number, required: true, unique: true},
    open_time: {type: Date, default: Date.now},
    close_time: {type: Date, default: null},
    status: {type: Boolean, default: true},
    pre_total: {type: Number, required: true, default: 0},
    total_pay_cash: {type: Number, default: 0},
    total_tip_cash: {type: Number, default: 0},
    total_pay_card: {type: Number, default: 0},
    total_tip_card: {type: Number, default: 0}
});

module.exports = mongoose.model('Order', orderSchema);