const db = require('../config/database');
const { deleteFile } = require('../utils/fileUtils');

const getProducts = (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    const query = `
        SELECT products.id, products.name AS product_name, 
               categories.name AS category_name, 
               products.category_id, products.image_path
        FROM products 
        INNER JOIN categories ON products.category_id = categories.id
        LIMIT ? OFFSET ?
    `;

    db.query(query, [pageSize, offset], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Add full URL for images
        const productsWithImages = results.map(product => ({
            ...product,
            image_path: product.image_path ? `http://localhost:${process.env.PORT || 5001}/${product.image_path}` : null
        }));
        res.json(productsWithImages);
    });
};

const addProduct = (req, res) => {
    const { name, category_id } = req.body;
    const imagePath = req.file ? req.file.path : null;
    
    db.query('INSERT INTO products (name, category_id, image_path) VALUES (?, ?, ?)', 
        [name, category_id, imagePath], 
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                id: result.insertId, 
                name,
                category_id,
                image_path: imagePath ? `http://localhost:${process.env.PORT || 5001}/${imagePath}` : null
            });
    });
};

const updateProduct = (req, res) => {
    const { name, category_id } = req.body;
    const imagePath = req.file ? req.file.path : null;
    
    let query = 'UPDATE products SET name = ?, category_id = ?';
    let params = [name, category_id];
    
    if (imagePath) {
        query += ', image_path = ?';
        params.push(imagePath);
    }
    
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            message: 'Product updated',
            image_path: imagePath ? `http://localhost:${process.env.PORT || 5001}/${imagePath}` : null
        });
    });
};

const deleteProduct = (req, res) => {
    const productId = req.params.id;
    
    // Get product image
    db.query('SELECT image_path FROM products WHERE id = ?', [productId], (err, productResults) => {
        if (err) return res.status(500).json({ 
            error: 'Database error while fetching product',
            details: err.message 
        });
        
        if (!productResults.length) {
            return res.status(404).json({
                error: 'Product not found',
                details: 'The product you are trying to delete does not exist'
            });
        }
        
        const productImagePath = productResults[0]?.image_path;

        // Delete the product
        db.query('DELETE FROM products WHERE id = ?', [productId], (err) => {
            if (err) return res.status(500).json({ 
                error: 'Database error while deleting product',
                details: err.message 
            });
            
            // Delete product image
            if (productImagePath) {
                try {
                    deleteFile(productImagePath);
                } catch (err) {
                    console.error('Error deleting image file:', err);
                }
            }
            
            res.json({ 
                message: 'Product deleted successfully',
                details: 'The product and its associated image have been removed'
            });
        });
    });
};

module.exports = {
    getProducts,
    addProduct,
    updateProduct,
    deleteProduct
}; 