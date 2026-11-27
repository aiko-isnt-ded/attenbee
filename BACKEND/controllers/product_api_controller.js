const fs = require('fs').promises;
const path = require('path');

const productFilePath = path.join(__dirname, "../data/products.json");

async function readProducts()
{
    let data = await fs.readFile(productFilePath, 'utf8');
    return JSON.parse(data);
}

async function writeProducts(products)
{
    await fs.writeFile(productFilePath, JSON.stringify(products, null, 2), 'utf8')
}

// Helper para crear los IDs
const slugify = (text) => text.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s]+/g, '-').replace(/[^\w-]+/g, '');

exports.createProduct = async (req, res) =>
{
    try
    {
        const {product_name, category, price, total_units, image, temperature} = req.body;

        if (!product_name || product_name.trim() === "")
        {
            return res.status(400).json({success: false, message:"El nombre es obligatorio!"});
        }

        if (price === undefined || Number(price) < 0)
        {
            return res.status(400).json({success: false, message: "El precio no puede ser negativo"});
        }

        let products = await readProducts();

        let base_slug = slugify(product_name);
        let product_id = base_slug;
        let counter = 2;
        while (products.some(p => p.product_id === product_id))
        {
            product_id = `${base_slug}-${counter}`;
            counter++;
        }

        const isStocked = category === 'panaderia' || category === "otros";

        let new_product =
        {
            _id: `prod_${Date.now()}`,
            product_id,
            category,
            image: image || '../../assets/colmena_logo.png',
            product_name: product_name.trim(),
            price: Number(price),
            total_units: isStocked ? Number(total_units): null,
            temperature: !isStocked && (temperature === 'hot' || temperature === 'cold') ? temperature : null,
        };

        products.push(new_product);
        await writeProducts(products);

        res.status(200).json({success: true, message: "Producto creado con éxito", data: new_product});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
}

exports.loadProducts = async (req, res) =>
{
    try
    {
        let products = await readProducts();
        
        if (!products)
        {
            res.status(404).json({success: false, message:"Productos no encontrados"});
        }

        res.status(200).json({success: true, data: products});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
}

exports.editProduct = async (req, res) =>
{
    try
    {
        const { product_id } = req.params;
        const { product_name, price, total_units} = req.body;

        if (!product_name || product_name.trim() === "")
        {
            return res.status(400).json({success: false, message: "El nombre no puede ser vacío"});
        }

        if (price === undefined || Number(price) < 0)
        {
            return res.status(400).json({success: false, message: "El precio no puede ser negativo"});
        }

        if (total_units !== null && total_units !== undefined && Number(total_units) < 0)
        {
            return res.status(400).json({success: false, message: "Las existencias no pueden ser negativas"});
        }

        let products = await readProducts();

        const index = products.findIndex(p => p.product_id === product_id);
        if (index === -1)
        {
            return res.status(404).json({success: false, message: "Producto no encontrado"});
        }

        products[index].product_name = product_name.trim();
        products[index].price = Number(price);
        if (products[index].total_units !== null)
        {
            products[index].total_units = Number(total_units);
        }

        await writeProducts(products);

        res.status(200).json({success: true, message: "Producto actualizado exitosamente", data: products[index]});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message}); 
    }
}

exports.deleteProduct = async (req, res) =>
{
    try
    {
        const { product_id } = req.params;
        let products = await readProducts();

        const index = products.findIndex(p => p.product_id === product_id);

        if (index === -1)
        {
            return res.status(404).json({success: false, message: "Producto no encontrado"});
        }

        const deleted_product = products.splice(index, 1)[0];

        await writeProducts(products);

        res.status(200).json({success: true, message: "Producto eliminado exitosamente", data: deleted_product});
    } catch (err)
    {
        return res.status(500).json({success: false, message: err.message});
    }
}