import React from 'react';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import CategoryIcon from '@mui/icons-material/Category';
import HomeIcon from '@mui/icons-material/Home';

const Header = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#2c3e50' }}>
      <Container>
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            component={RouterLink}
            to="/"
            sx={{
              mr: 2,
              fontFamily: 'monospace',
              fontWeight: 700,
              color: 'inherit',
              textDecoration: 'none',
              flexGrow: 1
            }}
          >
            PRODUCT EXPLORER
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              component={RouterLink}
              to="/"
              color="inherit"
              startIcon={<HomeIcon />}
            >
              Home
            </Button>
            <Button
              component={RouterLink}
              to="/add-category"
              color="inherit"
              startIcon={<CategoryIcon />}
            >
              Add Category
            </Button>
            <Button
              component={RouterLink}
              to="/add-product"
              color="inherit"
              startIcon={<AddBusinessIcon />}
              variant="outlined"
              sx={{ borderColor: 'white' }}
            >
              Add Product
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header; 