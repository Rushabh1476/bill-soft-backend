import React, { useState, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { Bill } from '../../types/bill';
import { InvoiceTemplate } from './core';
import { modernTheme } from '../../theme/theme';
import A4InvoicePreview from './previews/A4InvoicePreview';
import ClassicProfessionalPreview from './previews/ClassicProfessionalPreview';
import SimpleBasicPreview from './previews/SimpleBasicPreview';
import CorporateStandardPreview from './previews/CorporateStandardPreview';
import CreativeModernPreview from './previews/CreativeModernPreview';
import MinimalCleanPreview from './previews/MinimalCleanPreview';
import { templateAPI } from '../../services/api';

interface BillTemplateRendererProps {
    template: InvoiceTemplate;
    bill: Bill;
    preferences?: any;
}

const BillTemplateRenderer: React.FC<BillTemplateRendererProps> = ({ template, bill, preferences: initialPreferences }) => {
    const [preferences, setPreferences] = useState<any>(initialPreferences || null);

    useEffect(() => {
        if (initialPreferences) {
            setPreferences(initialPreferences);
            return;
        }

        const loadPreferences = async () => {
            try {
                const response = await templateAPI.fetchSettings('invoice_settings', 'general_preferences');
                if (response.success) {
                    setPreferences(response.data);
                }
            } catch (err) {
                console.error('Error loading preferences in renderer:', err);
            }
        };
        loadPreferences();
    }, [initialPreferences]);

    // We force a light theme for the invoice preview area because 
    // invoices are documents meant for print/viewing on a white background.
    const renderContent = () => {
        const commonProps = { template, bill, preferences };
        
        switch (template.id) {
            case '1':
                return <A4InvoicePreview {...commonProps} />;
            case '2':
                return <CorporateStandardPreview {...commonProps} />;
            case '3':
                return <SimpleBasicPreview {...commonProps} />;
            case '4':
                return <ClassicProfessionalPreview {...commonProps} />;
            case '5':
                return <CreativeModernPreview {...commonProps} />;
            case '6':
                return <MinimalCleanPreview {...commonProps} />;
            default:
                return <A4InvoicePreview {...commonProps} />;
        }
    };

    return (
        <ThemeProvider theme={modernTheme}>
            {renderContent()}
        </ThemeProvider>
    );
};

export default BillTemplateRenderer;
