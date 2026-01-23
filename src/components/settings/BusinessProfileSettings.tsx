import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
} from '@mui/icons-material';

/**
 * BusinessProfileSettings component handles company information and logo management
 * Follows Single Responsibility Principle by focusing only on business profile data
 */
const BusinessProfileSettings: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Company Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Company Name"
              defaultValue="Your Company Name"
              variant="outlined"
            />
            <TextField
              fullWidth
              label="Company Address"
              multiline
              rows={3}
              defaultValue="123 Business Street, City, State, PIN"
              variant="outlined"
            />
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="Phone Number"
                defaultValue="+91 9876543210"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="Email Address"
                defaultValue="contact@company.com"
                variant="outlined"
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
              <TextField
                fullWidth
                label="GST Number"
                defaultValue="29ABCDE1234F1Z5"
                variant="outlined"
              />
              <TextField
                fullWidth
                label="PAN Number"
                defaultValue="ABCDE1234F"
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Company Logo
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.main',
                fontSize: '2rem',
                fontWeight: 'bold'
              }}
            >
              YC
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload your company logo (PNG, JPG up to 2MB)
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<CloudUploadIcon />}
                  component="label"
                >
                  Upload Logo
                  <input type="file" hidden accept="image/*" />
                </Button>
                <Button variant="text" color="error">
                  Remove
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined">
          Cancel
        </Button>
        <Button variant="contained">
          Save Changes
        </Button>
      </Box>
    </Box>
  );
};

export default BusinessProfileSettings;