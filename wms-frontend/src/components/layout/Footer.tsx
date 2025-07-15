import React from 'react';
import { Box, Typography, Link } from '@mui/material';

export const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 2,
        px: 3,
        mt: 'auto',
        backgroundColor: 'grey.100',
        borderTop: 1,
        borderColor: 'grey.300',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © 2024 WMS System. All rights reserved.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Link href="#" color="text.secondary" underline="hover" variant="body2">
            Privacy Policy
          </Link>
          <Link href="#" color="text.secondary" underline="hover" variant="body2">
            Terms of Service
          </Link>
          <Link href="#" color="text.secondary" underline="hover" variant="body2">
            Support
          </Link>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          Version 1.0.0
        </Typography>
      </Box>
    </Box>
  );
}; 