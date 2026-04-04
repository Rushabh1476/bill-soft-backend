import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import A4BillPreview from './A4BillPreview';
import UnifiedTemplateSelector from './UnifiedTemplateSelector';
import { BillPreview, TemplateComplexity } from '../../types/billTemplate';

const BillPreviewDemo: React.FC = () => {
  const [selectedComplexity, setSelectedComplexity] = useState<TemplateComplexity>(TemplateComplexity.BETTER);
  const [showPreview, setShowPreview] = useState(false);

  const generateSampleBill = (): BillPreview => {
    return {
      templateId: 'demo-template',
      companyInfo: {
        name: 'BillSoft Technologies Pvt Ltd',
        address: '123 Tech Park, Electronic City, Bangalore, Karnataka 560100',
        phone: '+91 80 4567 8901',
        email: 'contact@billsoft.com',
        website: 'www.billsoft.com',
        taxId: 'GST29ABCDE1234F1Z5'
      },
      customerInfo: {
        name: 'Acme Corporation Ltd',
        address: '456 Business Avenue, Commercial District, Mumbai, Maharashtra 400001',
        phone: '+91 22 9876 5432',
        email: 'accounts@acmecorp.com',
        taxId: 'GST27FGHIJ5678K2Y6'
      },
      invoiceDetails: {
        invoiceNumber: 'INV-2024-10-001',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        poNumber: 'PO-ACME-2024-789',
        currency: 'INR'
      },
      items: [
        {
          description: 'Annual Software License - BillSoft Pro',
          quantity: 5,
          rate: 15000,
          amount: 75000,
          taxRate: 18,
          unit: 'licenses',
          category: 'Software License'
        },
        {
          description: 'Implementation & Setup Services',
          quantity: 40,
          rate: 2500,
          amount: 100000,
          taxRate: 18,
          unit: 'hours',
          category: 'Professional Services'
        },
        {
          description: 'Training Sessions (Remote)',
          quantity: 8,
          rate: 5000,
          amount: 40000,
          taxRate: 18,
          unit: 'sessions',
          category: 'Training'
        },
        {
          description: 'Priority Support Package (1 Year)',
          quantity: 1,
          rate: 25000,
          amount: 25000,
          taxRate: 18,
          unit: 'package',
          category: 'Support'
        }
      ],
      calculations: {
        subtotal: 240000,
        taxAmount: 43200,
        discountAmount: 12000,
        shippingAmount: 0,
        totalAmount: 271200,
        paidAmount: 100000,
        balanceAmount: 171200
      },
      additionalInfo: {
        notes: 'Thank you for choosing BillSoft! This invoice covers your annual software license, implementation services, and support package. All services will be provided as per our service agreement dated October 1, 2024.',
        terms: `PAYMENT TERMS:
• Payment is due within 30 days from invoice date
• Late payment charges of 2% per month will apply after due date
• All payments should be made in Indian Rupees (INR)
• Please quote invoice number in all payment communications

TERMS & CONDITIONS:
• Software license is non-transferable and subject to our EULA
• Support services are valid for 12 months from activation date
• Training sessions must be completed within 6 months
• Refunds are subject to our refund policy available on our website`,
        paymentMethods: ['NEFT/RTGS Bank Transfer', 'UPI Payment', 'Demand Draft'],
        bankDetails: `BANK DETAILS FOR PAYMENT:
Bank Name: HDFC Bank Ltd
Account Name: BillSoft Technologies Pvt Ltd
Account Number: 12345678901234
IFSC Code: HDFC0001234
Branch: Electronic City, Bangalore

UPI ID: billsoft@hdfc
Phone Pay: +91 80 4567 8901`,
        signature: 'Authorized Signature\nBillSoft Technologies Pvt Ltd'
      }
    };
  };

  const sampleBill = generateSampleBill();

  const handleTemplateSelection = (selection: any) => {
    setSelectedComplexity(selection.templateComplexity);
    console.log('Template selected:', selection);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Professional Invoice Preview System
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          A4-Sized, PDF-Ready Invoice Templates
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select your template complexity and see exactly how your invoices will look
        </Typography>
      </Box>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' },
        gap: 4 
      }}>
        {/* Template Selector */}
        <Box>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Template Configuration
              </Typography>
              <UnifiedTemplateSelector
                onSelectionChange={handleTemplateSelection}
                showPreview={false}
                compact={true}
              />
              
              <Divider sx={{ my: 3 }} />
              
              <Button
                variant="contained"
                fullWidth
                startIcon={<ReceiptIcon />}
                onClick={() => setShowPreview(true)}
                size="large"
              >
                View A4 Invoice Preview
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Preview Section */}
        <Box>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Live Invoice Preview
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This is exactly how your invoice will appear in A4 size
            </Typography>
          </Box>

          {showPreview ? (
            <Box sx={{ 
              transform: 'scale(0.7)', 
              transformOrigin: 'top center',
              mb: -20 // Compensate for scaling
            }}>
              <A4BillPreview
                billData={sampleBill}
                templateComplexity={selectedComplexity}
                showControls={true}
                onDownload={() => console.log('Downloaded!')}
                onPrint={() => console.log('Printed!')}
                onShare={() => console.log('Shared!')}
              />
            </Box>
          ) : (
            <Card elevation={2} sx={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <ReceiptIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Click "View A4 Invoice Preview" to see your invoice template
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  The preview will be shown in actual A4 size with all formatting
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Features Overview */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          Key Features
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 3,
          mt: 2 
        }}>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <DownloadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                PDF Export
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Download invoices as high-quality PDF files ready for printing or sharing
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                A4 Format
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Professional A4-sized invoices with perfect formatting and print optimization
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}>🎨</Box>
              <Typography variant="h6" gutterBottom>
                4 Templates
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose from Easy, Better, Complex, or Detailed templates based on your needs
              </Typography>
            </CardContent>
          </Card>
          <Card elevation={1}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ fontSize: 40, color: 'primary.main', mb: 1 }}>⚙️</Box>
              <Typography variant="h6" gutterBottom>
                Industry Specific
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Get industry-specific field suggestions for retail, IT, healthcare, and more
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default BillPreviewDemo;
