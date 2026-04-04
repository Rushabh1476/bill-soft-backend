import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

/**
 * SecuritySettings component handles data privacy and application information
 * Follows Single Responsibility Principle by focusing only on security and app info
 */
const SecuritySettings: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Data & Privacy
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Auto-backup data"
            />
            <FormControlLabel
              control={<Switch />}
              label="Share analytics data"
            />
            <Divider sx={{ my: 2 }} />
            <Button variant="outlined" color="primary" fullWidth>
              Export All Data
            </Button>
            <Button variant="outlined" color="error" fullWidth>
              Delete All Data
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Application Info
          </Typography>
          <List>
            <ListItem>
              <ListItemText
                primary="Version"
                secondary="1.0.0"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Last Updated"
                secondary={new Date().toLocaleDateString()}
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Total Bills"
                secondary="0"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Total Customers"
                secondary="0"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SecuritySettings;
