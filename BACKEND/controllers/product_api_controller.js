const path = require('path');
const fs = require('fs').promises;
const Product = require('../models/product');
const {UPLOAD_DIR} = require('../middleware/upload');
const DEFAULT_IMAGE = '/assets/colmena_logo.png';
const IMAGE_URL_PREFIX = '/assets/products/';

// Helper para crear los IDs
const slugify = (text) => text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s]+/g, '-').replace(/[^\w-]+/g, '');

async function removeImageFile(image_url)
{
    if (!image_url || !image_url.startsWith(IMAGE_URL_PREFIX)) return;
    try { await fs.unlink(path.join(UPLOAD_DIR, path.basename(image_url))); } catch (err) {}
}

const discardUpload = (req) => req.file ? removeImageFile(IMAGE_URL_PREFIX + req.file.filename) : null;

exports.createProduct = async (req, res) =>
{
    try
    {
        const {product_name, category, price, total_units, temperature} = req.body;

        if (!product_name || product_name.trim() === "")
        {
            await discardUpload(req);
            return res.status(400).json({success: false, message: "El nombre es obligatorio!"});
        }

        if (price === undefined || Number(price) < 0)
        {
            await discardUpload(req);
            return res.status(400).json({success: false, message: "El precio no puede ser negativo"});
        }

        const base_slug = slugify(product_name);
        let product_id = base_slug;
        let counter = 2;
        while (await Product.exists({product_id}))
        {
            product_id = `${base_slug}-${counter}`;
            counter++;
        }

        const isStocked = category === 'panaderia' || category === 'otros';

        const new_product = await Product.create
        ({
            product_id,
            category,
            image: req.file ? IMAGE_URL_PREFIX + req.file.filename : DEFAULT_IMAGE,
            product_name: product_name.trim(),
            price: Number(price),
            total_units: isStocked ? Number(total_units) : null,
            temperature: !isStocked && (temperature === 'hot' || temperature === 'cold') ? temperature : null
        });

        res.status(200).json({success: true, message: "Producto creado con éxito", data: new_product});
    } catch (err)
    {
        await discardUpload(req);
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.loadProducts = async (req, res) =>
{
    try
    {
        const products = await Product.find().sort({_id: 1}).lean();
        res.status(200).json({success: true, data: products});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.editProduct = async (req, res) =>
{
    try
    {
        const {product_id} = req.params;
        const {product_name, price, total_units} = req.body;

        if (!product_name || product_name.trim() === "")
        {
            await discardUpload(req);
            return res.status(400).json({success: false, message: "El nombre no puede ser vacío"});
        }

        if (price === undefined || Number(price) < 0)
        {
            await discardUpload(req);
            return res.status(400).json({success: false, message: "El precio no puede ser negativo"});
        }

        if (total_units !== null && total_units !== undefined && Number(total_units) < 0)
        {
            await discardUpload(req);
            return res.status(400).json({success: false, message: "Las existencias no pueden ser negativas"});
        }

        const product = await Product.findOne({product_id});
        if (!product)
        {
            await discardUpload(req);
            return res.status(404).json({success: false, message: "Producto no encontrado"});
        }

        const old_image = product.image;

        product.product_name = product_name.trim();
        product.price = Number(price);
        if (product.total_units !== null && product.total_units !== undefined && total_units !== null && total_units !== undefined)
        {
            product.total_units = Number(total_units);
        }
        if (req.file) product.image = IMAGE_URL_PREFIX + req.file.filename;

        await product.save();
        if (req.file) await removeImageFile(old_image);

        res.status(200).json({success: true, message: "Producto actualizado exitosamente", data: product});
    } catch (err)
    {
        await discardUpload(req);
        return res.status(500).json({success: false, message: err.message});
    }
};

exports.deleteProduct = async (req, res) =>
{
    try
    {
        const deleted_product = await Product.findOneAndDelete({product_id: req.params.product_id});

        if (!deleted_product)
        {
            return res.status(404).json({success: false, message: "Producto no encontrado"});
        }

        await removeImageFile(deleted_product.image);

        res.status(200).json({success: true, message: "Producto eliminado exitosamente", data: deleted_product});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
};