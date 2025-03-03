import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const LoadingSpinner = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px'
      }}
    >
      <CircularProgress sx={{ color: '#2c3e50' }} />
    </Box>
  );
};

export default LoadingSpinner; 