const Order = require('../models/order');
const Item = require('../models/item');
const Product = require('../models/product');
const Counter = require('../models/model_counter');

async function recalcPreTotal(order_id)
{
    const items = await Item.find({order_id}).lean();
    const total = items.reduce((sum, i) => sum + i.total_price, 0);
    await Order.updateOne({order_id}, {pre_total: total});
    return total;
}

async function productMap(items)
{
    const ids = [...new Set(items.map(i => i.product_id))];
    const products = await Product.find({product_id: {$in: ids}}).lean();
    return new Map(products.map(p => [p.product_id, p]));
}

exports.createOrder = async (req, res) =>
{
    try
    {
        const counter = await Counter.findOneAndUpdate
        (
            {_id: 'order_id'},
            {$inc: {seq: 1}},
            {new: true, upsert: true}
        );
        const new_order = await Order.create({order_id: counter.seq});

        res.status(200).json({success: true, message: "Orden creada!", data: new_order});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.addItemToOrder = async (req, res) =>
{
    try
    {
        const {order_id, product_id, qty, details} = req.body;

        const target_order_id = Number(order_id);
        const order = await Order.findOne({order_id: target_order_id});
        if (!order) return res.status(404).json({success: false, message: "Orden no encontrada"});
        if (!order.status) return res.status(400).json({success: false, message: "El pedido ya fue cerrado"});

        const product = await Product.findOne({product_id});
        if (!product) return res.status(404).json({success: false, message: "Producto no encontrado"});

        const quantity = Number(qty);
        if (!Number.isInteger(quantity) || quantity <= 0)
        {
            return res.status(400).json({success: false, message: "Cantidad inválida"});
        }

        const tracks_stock = product.total_units !== null && product.total_units !== undefined;
        if (tracks_stock)
        {
            const reserved = await Product.findOneAndUpdate
            (
                {product_id, total_units: {$gte: quantity}},
                {$inc: {total_units: -quantity}}
            );
            if (!reserved)
            {
                const current = await Product.findOne({product_id}).lean();
                return res.status(400).json({success: false, message: `Solo quedan ${current ? current.total_units : 0} disponibles de ${product.product_name}`});
            }
        }

        let unit_price = product.price;
        if (Array.isArray(details))
        {
            details.forEach(detail =>
            {
                if (detail === 'PA' || detail === 'TP') unit_price -= 500;
                if (detail === 'CJE' || detail === 'CE' || detail === 'CL') unit_price += 500;
            });
        }
        if (unit_price < 0) unit_price = 0;

        let new_item;
        try
        {
            new_item = await Item.create
            ({
                order_id: target_order_id,
                product_id: product.product_id,
                qty: quantity,
                total_price: unit_price * quantity,
                details: Array.isArray(details) ? details : []
            });
        } catch (err)
        {
            if (tracks_stock) await Product.updateOne({product_id}, {$inc: {total_units: quantity}});
            throw err;
        }

        const order_total = await recalcPreTotal(target_order_id);

        res.status(200).json({success: true, message: "Item añadido", data: new_item, order_total});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.getOrderWithItems = async (req, res) =>
{
    try
    {
        const targetOrderId = Number(req.params.order_id);
        const order = await Order.findOne({order_id: targetOrderId}).lean();
        if (!order) return res.status(404).json({success: false, message: "Orden no encontrada"});

        const items = await Item.find({order_id: targetOrderId}).sort({_id: 1}).lean();
        const products = await productMap(items);

        const order_items = items.map(item =>
        {
            const prod = products.get(item.product_id);
            return {
                ...item,
                product_name: prod ? prod.product_name : item.product_id,
                category: prod ? prod.category : 'otros',
                unit_price: prod ? prod.price : 0,
                temperature: prod ? prod.temperature || null : null
            };
        });

        res.status(200).json({success: true, order, items: order_items});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.removeItem = async (req, res) =>
{
    try
    {
        const removed = await Item.findOneAndDelete({item_id: req.params.item_id});
        if (!removed) return res.status(404).json({success: false, message: "Item not found"});

        await Product.updateOne
        (
            {product_id: removed.product_id, total_units: {$ne: null}},
            {$inc: {total_units: removed.qty}}
        );

        const order_total = await recalcPreTotal(removed.order_id);

        res.status(200).json({success: true, order_total});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.getOpenOrders = async (req, res) =>
{
    try
    {
        const from = req.query.from ? new Date(req.query.from) : null;
        const to = req.query.to ? new Date(req.query.to) : null;

        if ((from && isNaN(from)) || (to && isNaN(to))) return res.status(400).json({success: false, message: "Rango inválido de fechas"});

        const filter = {status: true};
        if (from || to)
        {
            filter.open_time = {};
            if (from) filter.open_time.$gte = from;
            if (to) filter.open_time.$lt = to;
        }

        const orders = await Order.find(filter).sort({open_time: 1}).lean();
        const items = await Item.find({order_id: {$in: orders.map(o => o.order_id)}}).sort({_id: 1}).lean();
        const products = await productMap(items);

        const result = orders.map(order =>
        ({
            ...order,
            items: items.filter(i => Number(i.order_id) === Number(order.order_id)).map(item =>
            {
                const prod = products.get(item.product_id);
                return {...item, product_name: prod ? prod.product_name : item.product_id, temperature: prod ? prod.temperature || null : null};
            })
        }));

        res.status(200).json({success: true, data: result});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.addPayment = async (req, res) =>
{
    try
    {
        const target_order_id = Number(req.params.order_id);
        const {method, close} = req.body;
        const amount = Number(req.body.amount);
        const tip = Number(req.body.tip) || 0;

        if (method !== "efectivo" && method !== "tarjeta")
        {
            return res.status(400).json({success: false, message: "Método de pago inválido"});
        }

        if (!Number.isInteger(amount) || amount <= 0 || !Number.isInteger(tip) || tip < 0)
        {
            return res.status(400).json({success: false, message: "Montos inválidos"});
        }

        const order = await Order.findOne({order_id: target_order_id});
        if (!order) return res.status(404).json({success: false, message: "Order not found"});
        if (!order.status) return res.status(400).json({success: false, message: "El pedido ya fue cerrado"});

        const remaining = order.pre_total - order.total_pay_cash - order.total_pay_card;
        if (amount > remaining)
        {
            return res.status(400).json({success: false, message: "Pago base demasiado grande"});
        }
        if (close && amount !== remaining)
        {
            return res.status(400).json({success: false, message: "Pago base insuficiente"});
        }

        if (method === "efectivo")
        {
            order.total_pay_cash += amount;
            order.total_tip_cash += tip;
        } else
        {
            order.total_pay_card += amount;
            order.total_tip_card += tip;
        }

        if (close)
        {
            order.status = false;
            order.close_time = new Date();
        }

        await order.save();
        res.status(200).json({success: true, remaining: remaining - amount});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.closeOrder = async (req, res) =>
{
    try
    {
        const order = await Order.findOne({order_id: Number(req.params.order_id)});
        if (!order) return res.status(404).json({success: false, message: "Order not found"});
        if (!order.status) return res.status(400).json({success: false, message: "El pedido ya fue cerrado"});

        const remaining = order.pre_total - order.total_pay_cash - order.total_pay_card;
        if (order.pre_total <= 0 || remaining !== 0)
        {
            return res.status(400).json({success: false, message: "Saldo pendiente"});
        }

        order.status = false;
        order.close_time = new Date();
        await order.save();

        res.status(200).json({success: true, order});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};


exports.getDaySummary = async (req, res) =>
{
    try
    {
        const from = new Date(req.query.from);
        const to = new Date(req.query.to);
        const prev_from = new Date(req.query.prev_from);
        if (isNaN(from) || isNaN(to) || isNaN(prev_from)) return res.status(400).json({success: false, message: "Rango de fechas inválido"});

        const orders = await Order.find({open_time: {$gte: prev_from, $lt: to}}).lean();
        const opened_between = (o, a, b) => o.open_time >= a && o.open_time < b;

        const today = orders.filter(o => opened_between(o, from, to));
        const yesterday = orders.filter(o => opened_between(o, prev_from, from));
        const sum = (list, key) => list.reduce((s, o) => s + (o[key] || 0), 0);

        const open_orders = today.filter(o => o.status === true && o.pre_total > 0).map(o => o.order_id);

        res.status(200).json({success: true, data:
        {
            open_orders,
            cash: {pay: sum(today, "total_pay_cash"), tip: sum(today, "total_tip_cash")},
            card: {pay: sum(today, "total_pay_card"), tip: sum(today, "total_tip_card")},
            yesterday_total: sum(yesterday, 'total_pay_cash') + sum(yesterday, 'total_pay_card') + sum(yesterday, 'total_tip_cash') + sum(yesterday, 'total_tip_card')
        }});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};