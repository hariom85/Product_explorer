const db = require('../config/database');
const { deleteFile } = require('../utils/fileUtils');

const getAllCategories = (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Add full URL for images
        const categoriesWithImages = results.map(category => ({
            ...category,
            image_path: category.image_path ? `http://localhost:${process.env.PORT || 5001}/${category.image_path}` : null
        }));
        res.json(categoriesWithImages);
    });
};

const addCategory = (req, res) => {
    const { name } = req.body;
    const imagePath = req.file ? req.file.path : null;
    
    db.query('INSERT INTO categories (name, image_path) VALUES (?, ?)', 
        [name, imagePath], 
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                id: result.insertId, 
                name,
                image_path: imagePath ? `http://localhost:${process.env.PORT || 5001}/${imagePath}` : null
            });
    });
};

const updateCategory = (req, res) => {
    const { name } = req.body;
    const imagePath = req.file ? req.file.path : null;
    
    let query = 'UPDATE categories SET name = ?';
    let params = [name];
    
    if (imagePath) {
        query += ', image_path = ?';
        params.push(imagePath);
    }
    
    query += ' WHERE id = ?';
    params.push(req.params.id);
    
    db.query(query, params, (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ 
            message: 'Category updated',
            image_path: imagePath ? `http://localhost:${process.env.PORT || 5001}/${imagePath}` : null
        });
    });
};

const deleteCategory = (req, res) => {
    const categoryId = req.params.id;
    
    // First check if category has products
    db.query('SELECT COUNT(*) as count FROM products WHERE category_id = ?', [categoryId], (err, results) => {
        if (err) return res.status(500).json({ 
            error: 'Database error while checking products',
            details: err.message 
        });
        
        const productCount = results[0].count;
        if (productCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category',
                details: `This category contains ${productCount} products. Please delete or move these products before deleting the category.`
            });
        }
        
        // Get category image
        db.query('SELECT image_path FROM categories WHERE id = ?', [categoryId], (err, categoryResults) => {
            if (err) return res.status(500).json({ 
                error: 'Database error while fetching category',
                details: err.message 
            });
            
            if (!categoryResults.length) {
                return res.status(404).json({
                    error: 'Category not found',
                    details: 'The category you are trying to delete does not exist'
                });
            }
            
            const categoryImagePath = categoryResults[0]?.image_path;

            // Delete the category
            db.query('DELETE FROM categories WHERE id = ?', [categoryId], (err) => {
                if (err) return res.status(500).json({ 
                    error: 'Database error while deleting category',
                    details: err.message 
                });
                
                // Delete category image
                if (categoryImagePath) {
                    try {
                        deleteFile(categoryImagePath);
                    } catch (err) {
                        console.error('Error deleting image file:', err);
                    }
                }
                
                res.json({ 
                    message: 'Category deleted successfully',
                    details: 'The category and its associated image have been removed'
                });
            });
        });
    });
};

module.exports = {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory
}; 