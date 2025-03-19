const mysql = require('mysql2');

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

module.exports = db; 