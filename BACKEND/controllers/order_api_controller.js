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
                if (detail === 'CJE' || detail === 'CE') unit_price += 500;
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