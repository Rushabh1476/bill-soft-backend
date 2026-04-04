import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Paper,
  Stack,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore,
  Email,
  Phone,
  LocationOn,
  SupportAgent,
  ArrowBack,
  HelpOutline,
  Send,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import API_URL from '../config/api';

const Support: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/web/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: '',
          message: `Subject: ${formData.subject}\n\n${formData.message}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setOpenSnackbar(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      console.error('Error sending support message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    {
      question: "How do I reset my password?",
      answer: "You can reset your password by clicking 'Forgot Password' on the login page and following the instructions sent to your email."
    },
    {
      question: "How can I update my profile?",
      answer: "Navigate to the 'Profile' section in your dashboard to update your personal information, contact details, and company logo."
    },
    {
      question: "Where can I see my bills and inventory?",
      answer: "All your generated bills are listed in the 'Bills' section. Inventory can be managed under the 'Products' or 'Inventory' tab in your main dashboard."
    },
    {
      question: "How do I generate a GST report for filing?",
      answer: "Go to the 'Reports' section, select 'GST Reports', chooses the desired month/quarter, and click 'Export' to get your data in Excel or PDF format."
    },
    {
      question: "Is my billing data secure on BillSoft?",
      answer: "Yes, we use industry-standard encryption and secure database systems. Regular backups are performed to ensure your data is safe and always accessible."
    },
    {
      question: "Can I customize the design of my invoices?",
      answer: "Absolutely! Go to 'Settings' > 'Invoice Settings' to choose templates, add your logo, specify bank details, and customize colors to match your brand."
    },
    {
      question: "How do I add multiple users or staff to my account?",
      answer: "Administrators can add sub-users by navigating to 'User Management'. You can assign specific roles like 'Operator' or 'Accountant' with restricted permissions."
    },
    {
      question: "Do you support barcode scanning for faster billing?",
      answer: "Yes, BillSoft is compatible with most standard USB and Bluetooth barcode scanners for quick product lookup and billing."
    },
    {
      question: "How do I import my existing product list?",
      answer: "In the 'Products' section, click the 'Import' button. You can download our Excel template, fill in your product details, and upload it back for bulk entry."
    },
    {
      question: "Can I manage multiple business branches?",
      answer: "Yes, the 'Multi-Branch' module allows you to track sales, stock, and staff across different locations with centralized management."
    },
    {
      question: "How do I set up low-stock alerts?",
      answer: "Go to 'Inventory Settings' and define a 'Minimum Quantity' for each product. The system will alert you when stock levels fall below this threshold."
    },
    {
      question: "Can I track customer loyalty points?",
      answer: "Our CRM module allows you to award points for every purchase. Customers can later redeem these points for discounts on future bills."
    },
    {
      question: "How do I record business expenses?",
      answer: "Use the 'Expenses' module to log daily costs like rent, electricity, and salaries to get an accurate view of your net profit."
    },
    {
      question: "Can I export my customer list for marketing?",
      answer: "Yes, you can export your entire customer database to Excel from the 'Customers' section to run email or SMS campaigns."
    },
    {
      question: "Is there an offline mode for BillSoft?",
      answer: "Currently, BillSoft is a cloud-based application requiring an internet connection. This ensures your data is always synced and backed up in real-time."
    },
    {
      question: "How do I create quotations for clients?",
      answer: "Navigate to the 'Invoices' section and choose 'Create Quotation'. Once approved, you can convert it into a final bill with a single click."
    },
    {
      question: "Does the system support credit/debit note entry?",
      answer: "Yes, you can issue credit notes for customer returns and debit notes for purchase adjustments in the 'Accounts' module."
    },
    {
      question: "Can I track product expiry dates?",
      answer: "Absolutely! You can record expiry dates for batches, and the system will notify you of upcoming expirations in the inventory dashboard."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can manage your plan under 'Subscription Settings'. You can cancel or downgrade your plan at any time; your data remains yours."
    },
    {
      question: "Do you offer custom software development?",
      answer: "If your business has unique requirements, contact our enterprise support via this form for information on custom integrations and private hosting."
    }
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#f5f7fa',
      pb: 8
    }}>
      {/* Header */}
      <Paper elevation={0} sx={{
        p: 2,
        bgcolor: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/login')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <SupportAgent color="primary" sx={{ mr: 1, fontSize: 32 }} />
          <Typography variant="h6" fontWeight="bold">
            BillSoft Support
          </Typography>
        </Box>
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
          <Email color="primary" sx={{ mr: 1 }} />
          <Typography variant="body2" fontWeight="600" color="text.secondary">
            support@agbtechnologies.com
          </Typography>
        </Box>
      </Paper>

      <Container maxWidth="md" sx={{ mt: 6 }}>
        {/* FAQ Section - Now at the Top */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <HelpOutline color="primary" sx={{ fontSize: 45, mb: 2 }} />
            <Typography variant="h3" fontWeight="800" sx={{ color: '#1a237e', mb: 2 }}>
              Frequently Asked Questions
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Find quick answers to common questions about BillSoft
            </Typography>
          </Box>

          <Box>
            {faqs.map((faq, index) => (
              <Accordion
                key={index}
                sx={{
                  mb: 1.5,
                  borderRadius: '16px !important',
                  '&:before': { display: 'none' },
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  overflow: 'hidden',
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 3, py: 1.5 }}>
                  <Typography fontWeight="700" variant="subtitle1">{faq.question}</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 3, pb: 4, pt: 0 }}>
                  <Typography color="text.secondary" variant="body1" sx={{ lineHeight: 1.7 }}>
                    {faq.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Box>

        {/* Contact Form Section - Now below FAQ */}
        <Box id="contact-form" sx={{ pt: 4, borderTop: '2px dashed rgba(0,0,0,0.1)' }}>
          <Box sx={{ textAlign: 'center', mb: 4, mt: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ color: '#1a237e' }}>
              Still need help?
            </Typography>
            <Typography variant="body1" color="text.secondary">
              If your question isn't answered above, please fill out this form and we'll get back to you within 24 hours.
            </Typography>
          </Box>

          <Card sx={{ borderRadius: 4, boxShadow: '0 12px 40px rgba(0,0,0,0.08)', mb: 6 }}>
            <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
              <Box component="form" onSubmit={handleSubmit}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    variant="outlined"
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    variant="outlined"
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  sx={{ mb: 3 }}
                />
                <TextField
                  fullWidth
                  label="Message"
                  name="message"
                  multiline
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  sx={{ mb: 4 }}
                />
                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  type="submit"
                  disabled={isSubmitting}
                  sx={{
                    py: 2,
                    fontWeight: '800',
                    textTransform: 'none',
                    fontSize: '1.2rem',
                    borderRadius: 3,
                    boxShadow: '0 6px 20px rgba(48, 92, 222, 0.4)'
                  }}
                  startIcon={isSubmitting ? <CircularProgress size={24} color="inherit" /> : <Send />}
                >
                  {isSubmitting ? 'Sending Message...' : 'Submit Support Request'}
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Contact Info Footer */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
            gap: 4,
            pb: 4
          }}>
            <Stack alignItems="center" sx={{ textAlign: 'center' }}>
              <IconButton color="primary" sx={{ bgcolor: 'white', boxShadow: 2, mb: 2, p: 2 }}>
                <Email />
              </IconButton>
              <Typography variant="subtitle1" fontWeight="800">Email Us</Typography>
              <Typography variant="body2" color="text.secondary">support@agbtechnologies.com</Typography>
            </Stack>
            <Stack alignItems="center" sx={{ textAlign: 'center' }}>
              <IconButton color="primary" sx={{ bgcolor: 'white', boxShadow: 2, mb: 2, p: 2 }}>
                <Phone />
              </IconButton>
              <Typography variant="subtitle1" fontWeight="800">Call Us</Typography>
              <Typography variant="body2" color="text.secondary">+91 90498 74780</Typography>
            </Stack>
            <Stack alignItems="center" sx={{ textAlign: 'center' }}>
              <IconButton color="primary" sx={{ bgcolor: 'white', boxShadow: 2, mb: 2, p: 2 }}>
                <LocationOn />
              </IconButton>
              <Typography variant="subtitle1" fontWeight="800">Visit Us</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250 }}>
                New Mangalwar Peth, Pune, Maharashtra 411011
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" sx={{ width: '100%' }} variant="filled">
          Support request submitted! Check the Super Admin panel to view it.
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Support;
