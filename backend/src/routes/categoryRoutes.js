const express = require('express');
const router = express.Router();
const upload = require('../config/upload');
const {
    getAllCategories,
    addCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/categoryController');

router.get('/', getAllCategories);
router.post('/', upload.single('image'), addCategory);
router.put('/:id', upload.single('image'), updateCategory);
router.delete('/:id', deleteCategory);

module.exports = router; 