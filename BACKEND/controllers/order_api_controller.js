const fs = require('fs').promises;
const path = require('path');

const order_file_path = path.join(__dirname, '../data/orders.json');
const item_file_path = path.join(__dirname, '../data/items.json');
const product_file_path = path.join(__dirname, '../data/products.json');

async function readJSON(file_path)
{
    const data = await fs.readFile(file_path, 'utf8');
    return JSON.parse(data);
}

async function writeJSON(file_path, data)
{
    await fs.writeFile(file_path, JSON.stringify(data, null, 2), 'utf8');
}

exports.createOrder = async (req, res) =>
{
    try
    {
        let orders = await readJSON(order_file_path);

        const max_id = orders.reduce((max, o) => (o.order_id > max ? o.order_id : max), 0);
        const new_order_id = max_id + 1;

        let new_order =
        {
            _id: `order_obj_id_${Date.now()}`,
            order_id: new_order_id,
            open_time: new Date().toISOString(),
            close_time: null,
            status: true,
            pre_total: 0,
            total_pay_cash: 0,
            total_tip_cash: 0,
            total_pay_card: 0,
            total_tip_card: 0
        };

        orders.push(new_order);
        await writeJSON(order_file_path, orders);

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

        let orders = await readJSON(order_file_path);
        let products = await readJSON(product_file_path);
        let items = await readJSON(item_file_path);

        const targetOrderId = Number(order_id);
        const order = orders.find(o => Number(o.order_id) === targetOrderId);
        if (!order) return res.status(404).json({success: false, message: "Orden no encontrada"});

        const product = products.find(p => p.product_id === product_id);
        if (!product) return res.status(404).json({success: false, message: "Producto no encontrado"});

        let unit_price = product.price;

        if (details && Array.isArray(details))
        {
            details.forEach(detail =>
            {
                if (detail === 'PA' || detail === 'TP') unit_price -= 500;
                if (detail === 'CJE' || detail === 'CE' || detail === "CL") unit_price += 500;
            });
        }

        if (unit_price < 0) unit_price = 0;
        const total_price = unit_price * Number(qty);

        let new_item =
        {
            _id: `item-obj-id-${Date.now()}`,
            item_id: `item-id-${Date.now()}`,
            order_id: targetOrderId,
            product_id: product.product_id,
            qty: Number(qty),
            total_price: total_price,
            details: details || []
        };

        items.push(new_item);

        const order_items = items.filter(i => Number(i.order_id) === targetOrderId);
        order.pre_total = order_items.reduce((sum, i) => sum + i.total_price, 0);

        await writeJSON(item_file_path, items);
        await writeJSON(order_file_path, orders);

        res.status(200).json({success: true, message: "Item añadido", data: new_item, order_total: order.pre_total});
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
        let orders = await readJSON(order_file_path);
        let items = await readJSON(item_file_path);
        let products = await readJSON(product_file_path);

        const order = orders.find(o => Number(o.order_id) === targetOrderId);
        if (!order) return res.status(404).json({success: false, message: "Orden no encontrada"});

        const order_items = items.filter(i => Number(i.order_id) === targetOrderId).map(item =>
        {
            const prod = products.find(p => p.product_id === item.product_id);
            return {
                ...item,
                product_name: prod ? prod.product_name : item.product_id,
                category: prod ? prod.category : 'otros',
                unit_price: prod ? prod.price : 0
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
        const item_id = req.params.item_id;
        let items = await readJSON(item_file_path);
        let orders = await readJSON(order_file_path);

        const index = items.findIndex(i => i.item_id === item_id || i._id === item_id);
        if (index === -1) return res.status(404).json({success: false, message: "Item not found"});

        const removed = items.splice(index, 1)[0];
        const order_id = removed.order_id;

        const order = orders.find(o => Number(o.order_id) === Number(order_id));
        if (order)
        {
            const order_items = items.filter(i => Number(i.order_id) === Number(order_id));
            order.pre_total = order_items.reduce((sum, i) => sum + i.total_price, 0);
        }

        await writeJSON(item_file_path, items);
        await writeJSON(order_file_path, orders);

        res.status(200).json({success: true, order_total: order ? order.pre_total : 0});
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

        if ((from && isNaN(from)) || to && isNaN(to)) return res.status(400).json({success: false, message: "Rango inválido de fechas"});

        const orders = await readJSON(order_file_path);
        const items = await readJSON(item_file_path);
        const products = await readJSON(product_file_path);

        const result = orders.filter(o => o.status == true).filter(o =>
        {
            const t = new Date(o.open_time);
            return (!from || t >= from) && (!to || t < to);
        }).sort((a,b) => new Date(a.open_time) - new Date(b.open_time)).map(order =>
        ({
            ...order,
            items: items.filter(i => Number(i.order_id) === Number(order.order_id)).map(item =>
            {
                const prod = products.find(p => p.product_id === item.product_id);
                return {...item, product_name: prod ? prod.product_name : item.product_id};
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

        const orders = await readJSON(order_file_path);
        const order = orders.find(o => o.order_id === target_order_id);
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
            order.close_time = new Date().toISOString();
        }

        await writeJSON(order_file_path, orders);
        res.status(200).json({success: true, remaining: remaining - amount});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
}

exports.closeOrder = async (req, res) =>
{
    try
    {
        const target_order_id = Number(req.params.order_id);
        const orders = await readJSON(order_file_path);
        const order = orders.find(o => o.order_id === target_order_id);
        if (!order) return res.status(404).json({success: false, message: "Order not found"});
        if (!order.status) return res.status(400).json({success: false, message: "El pedido ya fue cerrado"});

        const remaining = order.pre_total - order.total_pay_cash - order.total_pay_card;
        if (order.pre_total <= 0 || remaining !== 0)
        {
            return res.status(400).json({success: false, message: "Saldo pendiente"});
        }

        order.status = false;
        order.close_time = new Date().toISOString();

        await writeJSON(order_file_path, orders);

        res.status(200).json({success: true, order});
        
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
}

exports.getDaySummary = async (req, res) =>
{
    try
    {
        const from = new Date(req.query.from);
        const to = new Date(req.query.to);
        const prev_from = new Date(req.query.prev_from);
        if (isNaN(from) || isNaN(to) || isNaN(prev_from)) return res.status(400).json({success: false, message: "Rango de fechas inválido"});

        const orders = await readJSON(order_file_path);
        const opened_between = (o,a,b) => 
        { 
            const t = new Date(o.open_time); 
            return t >= a && t < b;
        };

        const today = orders.filter(o => opened_between(o, from, to));
        const yesterday = orders.filter(o => opened_between(o, prev_from, from));
        const sum = (list, key) => list.reduce((s,o) => s + (o[key] || 0), 0);

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
}