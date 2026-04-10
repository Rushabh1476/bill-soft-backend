import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { getModernTheme, getDarkTheme, getNightTheme } from '../theme/theme';
import axios from 'axios';
import { API_URL } from '../config/api';

type AppearanceMode = 'light' | 'dark' | 'night';

interface ThemeContextType {
    mode: AppearanceMode;
    setMode: (mode: AppearanceMode) => void;
    primaryColor: string;
    setPrimaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [mode, setMode] = useState<AppearanceMode>(() => {
        const saved = localStorage.getItem('appearanceMode');
        return (saved as AppearanceMode) || 'light';
    });

    const [primaryColor, setPrimaryColor] = useState<string>(() => {
        // Task 3: Load from localStorage or Fallback to Light Blue (#3b82f6)
        return localStorage.getItem('brandColor') || '#3b82f6';
    });

    useEffect(() => {
        const handleColorEvent = (e: any) => {
            if (e.detail?.color) {
                setPrimaryColor(e.detail.color);
                localStorage.setItem('brandColor', e.detail.color);
            }
        };
        window.addEventListener('branding-updated', handleColorEvent);
        return () => window.removeEventListener('branding-updated', handleColorEvent);
    }, []);

    useEffect(() => {
        localStorage.setItem('appearanceMode', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('appearancePrimaryColor', primaryColor);
    }, [primaryColor]);

    // Sync with server on bootup to ensure absolute persistence
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;
                
                // Fetch from the invoice-preferences settings (Primary Source for Branding)
                const res = await axios.get(`${API_URL}/admin/settings/invoice-preferences`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                // Priority Logic: Check both potential keys from backend
                const backendColor = res.data.data?.primary_branding_color || res.data.data?.primaryColor;
                
                // If backend has a valid color, sync it to localStorage
                if (backendColor && backendColor !== '#ed6c02') {
                    localStorage.setItem('brandColor', backendColor);
                    setPrimaryColor(backendColor);
                    document.documentElement.style.setProperty('--primary-color', backendColor);
                } else {
                    // Fallback to local storage if backend is empty or corrupt
                    const localColor = localStorage.getItem('brandColor') || '#3b82f6';
                    setPrimaryColor(localColor);
                    document.documentElement.style.setProperty('--primary-color', localColor);
                }

                // Additionally sync theme mode
                const settingsRes = await axios.get(`${API_URL}/admin/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (settingsRes.data.success && settingsRes.data.flatData) {
                    const modeSetting = settingsRes.data.flatData.find((s: any) => s.key === 'appearance_theme_mode');
                    if (modeSetting && modeSetting.value) {
                        setMode(modeSetting.value as AppearanceMode);
                    }
                }
            } catch (err) {
                console.warn('[ThemeContext] Sync failed, using fallback');
            }
        };
        fetchSettings();
    }, []);

    // 2. Real-time Event-based Sync (No Refresh required)
    useEffect(() => {
        const handleBrandingSync = (e: any) => {
            const newColor = e.detail?.color;
            if (newColor && newColor !== primaryColor) {
                // UPDATE STATE (Triggers Re-render of theme)
                setPrimaryColor(newColor);
                // All real-time sync handled by ThemeContext.tsx
                // SYNC CSS (For absolute global coverage)
                document.documentElement.style.setProperty('--primary-color', newColor);
                localStorage.setItem('brandColor', newColor);
            }
        };

        window.addEventListener('branding-updated', handleBrandingSync);
        return () => window.removeEventListener('branding-updated', handleBrandingSync);
    }, [primaryColor]);
    const currentTheme = useMemo(() => {
        switch (mode) {
            case 'dark': return getDarkTheme(primaryColor);
            case 'night': return getNightTheme(primaryColor);
            default: return getModernTheme(primaryColor);
        }
    }, [mode, primaryColor]);

    return (
        <ThemeContext.Provider value={{ mode, setMode, primaryColor, setPrimaryColor }}>
            <ThemeProvider theme={currentTheme}>
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
};

export const useAppTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useAppTheme must be used within an AppThemeProvider');
    }
    return context;
};
