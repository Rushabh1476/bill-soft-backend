import React, { useState } from 'react';
import { Routes, Route, useNavigate } from "react-router-dom";
import ChangePassword from "./ChangePassword";
import PrivacySettings from "./PrivacySettings";
import "../styles/profile.css";


import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    company: 'BillSoft Inc',
    role: 'Administrator',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: '',
      company: 'BillSoft Inc',
      role: 'Administrator',
    });
    setIsEditing(false);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Profile updated successfully!
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        {/* Profile Information */}
        <Box>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                  Profile Information
                </Typography>
                {!isEditing ? (
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    variant="outlined"
                    size="small"
                  >
                    Edit Profile
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      startIcon={<SaveIcon />}
                      onClick={handleSave}
                      variant="contained"
                      size="small"
                    >
                      Save
                    </Button>
                    <Button
                      startIcon={<CancelIcon />}
                      onClick={handleCancel}
                      variant="outlined"
                      size="small"
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                    type="email"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                    placeholder="+91 9876543210"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Company"
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    disabled={!isEditing}
                    variant="outlined"
                  />
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Role"
                    value={formData.role}
                    disabled
                    variant="outlined"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Profile Picture & Account Info */}
        <Box>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <IconButton
                    color="primary"
                    component="label"
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      border: 2,
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'background.paper' }
                    }}
                  >
                    <PhotoCameraIcon fontSize="small" />
                    <input type="file" hidden accept="image/*" />
                  </IconButton>
                }
              >
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    fontSize: '3rem',
                    bgcolor: 'primary.main',
                    mx: 'auto',
                    mb: 2
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
              </Badge>

              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {user?.name || 'User Name'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email || 'user@example.com'}
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="medium">
                {user?.plan || 'Pro Plan'}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Status
                </Typography>
                <Typography variant="body2" color="success.main" fontWeight="medium" gutterBottom>
                  ✓ Active
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Member Since
                </Typography>
                <Typography variant="body2" gutterBottom>
                  October 2025
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
                  Last Login
                </Typography>
                <Typography variant="body2">
                  {new Date().toLocaleDateString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div className="profile-container">

  <div className="quick-actions">
    <div
      className="quick-btn"
      onClick={() => navigate("password")}
    >
      <h4>Change Password</h4>
      <p>Update your account password securely</p>
    </div>

    <div
      className="quick-btn"
      onClick={() => navigate("privacy")}
    >
      <h4>Privacy Settings</h4>
      <p>Manage your privacy preferences</p>
    </div>
  </div>

  <div className="dashboard-wrapper">
    <Routes>
      <Route path="password" element={<ChangePassword />} />
      <Route path="privacy" element={<PrivacySettings />} />
    </Routes>
  </div>

</div>



              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;