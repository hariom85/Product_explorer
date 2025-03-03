import React from 'react';
import {
  FormControl,
  InputLabel,
  Input,
  Button,
  Box,
  Typography,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];

const ImageUpload = ({ 
  label, 
  onChange, 
  imagePreview, 
  error, 
  setError 
}) => {
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setError('File size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Only JPG, PNG and GIF images are allowed');
        return;
      }

      // Create preview URL and pass file to parent
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <FormControl fullWidth sx={{ mb: 3 }}>
      <InputLabel shrink htmlFor="image-upload">
        {label}
      </InputLabel>
      <Input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        sx={{ display: 'none' }}
      />
      <Button
        component="label"
        htmlFor="image-upload"
        variant="outlined"
        startIcon={<CloudUploadIcon />}
        sx={{ mt: 2 }}
      >
        Upload Image
      </Button>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {imagePreview && (
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <img
            src={imagePreview}
            alt="Preview"
            style={{
              maxWidth: '100%',
              maxHeight: '200px',
              objectFit: 'contain'
            }}
          />
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Preview
          </Typography>
        </Box>
      )}
    </FormControl>
  );
};

export default ImageUpload; 