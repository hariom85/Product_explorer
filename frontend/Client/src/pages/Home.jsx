import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Box,
  IconButton,
  Pagination,
  Stack,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import LoadingSpinner from '../components/common/LoadingSpinner';
import SearchBar from '../components/common/SearchBar';

// Import local images
import carousel1 from '../assets/images/carousel/carousel1.jpg';
import carousel2 from '../assets/images/carousel/carousel2.jpg';
import carousel3 from '../assets/images/carousel/carousel3.jpg';

const Home = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState('');
  const [error, setError] = useState('');

  const carouselImages = [carousel1, carousel2, carousel3];
  const itemsPerPage = 8;

  useEffect(() => {
    fetchData();
  }, [page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch categories
      const categoriesRes = await fetch('http://localhost:5001/categories');
      const categoriesData = await categoriesRes.json();
      setCategories(categoriesData);

      // Fetch products with pagination
      const productsRes = await fetch(`http://localhost:5001/products?page=${page}&pageSize=${itemsPerPage}`);
      const productsData = await productsRes.json();
      setProducts(productsData);
      setTotalPages(Math.ceil(productsData.length / itemsPerPage));
    } catch (err) {
      console.error('Error fetching data:', err);
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    setError('');
    try {
      const endpoint = deleteType === 'category' 
        ? `http://localhost:5001/categories/${itemToDelete}`
        : `http://localhost:5001/products/${itemToDelete}`;
      
      const response = await fetch(endpoint, { method: 'DELETE' });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to delete item');
      }
      
      fetchData();
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const openDeleteDialog = (id, type) => {
    setItemToDelete(id);
    setDeleteType(type);
    setDeleteDialogOpen(true);
  };

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000
  };

  const filteredProducts = products.filter(product =>
    product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <Box sx={{ minHeight: '100vh',minWidth: '100vw', pb: 6 }}>
      {/* Hero Carousel */}

      <Container>
        {/* Categories Section */}
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Categories
        </Typography>
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={category.image_path || `https://source.unsplash.com/400x300/?${category.name}`}
                  alt={category.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {category.name}
                  </Typography>
                </CardContent>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                  }}
                  onClick={() => openDeleteDialog(category.id, 'category')}
                >
                  <DeleteIcon />
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Products Section */}
        <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
          Latest Products
        </Typography>
        
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search products..."
        />

        <Grid container spacing={4}>
          {filteredProducts.map((product) => (
            <Grid item xs={12} sm={6} md={3} key={product.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={product.image_path || `https://source.unsplash.com/400x400/?${product.product_name}`}
                  alt={product.product_name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h6" component="div">
                    {product.product_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Category: {product.category_name}
                  </Typography>
                </CardContent>
                <IconButton
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                  }}
                  onClick={() => openDeleteDialog(product.id, 'product')}
                >
                  <DeleteIcon />
                </IconButton>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
          />
        </Stack>
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setError('');
        }}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this {deleteType}? This action cannot be undone.
          </DialogContentText>
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setError('');
          }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home; 