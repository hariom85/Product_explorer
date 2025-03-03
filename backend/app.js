const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the destination folder based on the route
    const folder = req.path.includes('categories') ? 'uploads/categories' : 'uploads/products';
    cb(null, folder);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only image files
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'test_db'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to MySQL database');
    
    // Add image_path column to categories table
    db.query('ALTER TABLE categories ADD COLUMN image_path VARCHAR(255)', (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
            console.error('Error modifying categories table:', err);
        } else {
            console.log('Categories table updated successfully');
        }
        
        // Add image_path column to products table
        db.query('ALTER TABLE products ADD COLUMN image_path VARCHAR(255)', (err) => {
            if (err && err.code !== 'ER_DUP_FIELDNAME') {
                console.error('Error modifying products table:', err);
            } else {
                console.log('Products table updated successfully');
            }
        });
    });
});

// Helper function to delete file
const deleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};


// ------------------- CATEGORY ROUTES -------------------



// Get all categories
app.get('/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        // Add full URL for images
        const categoriesWithImages = results.map(category => ({
            ...category,
            image_path: category.image_path ? `http://localhost:${PORT}/${category.image_path}` : null
        }));
        res.json(categoriesWithImages);
    });
});




// Add a category with image
app.post('/categories', upload.single('image'), (req, res) => {
    const { name } = req.body;
    const imagePath = req.file ? req.file.path : null;
    
    db.query('INSERT INTO categories (name, image_path) VALUES (?, ?)', 
        [name, imagePath], 
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ 
                id: result.insertId, 
                name,
                image_path: imagePath ? `http://localhost:${PORT}/${imagePath}` : null
            });
    });
});




// Update a category
app.put('/categories/:id', upload.single('image'), (req, res) => {
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
            image_path: imagePath ? `http://localhost:${PORT}/${imagePath}` : null
        });
    });
});




// Delete a category
app.delete('/categories/:id', (req, res) => {
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
});


// ------------------- PRODUCT ROUTES -------------------

// Get products with pagination
app.get('/products', (req, res) => {
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
            image_path: product.image_path ? `http://localhost:${PORT}/${product.image_path}` : null
        }));
        res.json(productsWithImages);
    });
});


// Add a product with image
app.post('/products', upload.single('image'), (req, res) => {
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
                image_path: imagePath ? `http://localhost:${PORT}/${imagePath}` : null
            });
    });
});

// Update a product
app.put('/products/:id', upload.single('image'), (req, res) => {
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
            image_path: imagePath ? `http://localhost:${PORT}/${imagePath}` : null
        });
    });
});

// Delete a product
app.delete('/products/:id', (req, res) => {
    // First get the product to find its image
    db.query('SELECT image_path FROM products WHERE id = ?', [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const imagePath = results[0]?.image_path;
        
        // Then delete the product
        db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
            if (err) return res.status(500).json({ error: err.message });
            
            // If deletion successful, delete the image file
            if (imagePath) {
                deleteFile(imagePath);
            }
            
            res.json({ message: 'Product deleted' });
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
