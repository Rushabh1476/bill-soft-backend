import { createTheme } from '@mui/material/styles';

// Theme Color Constants (Pitch Black / Neutral Dark)
// Dark: Pure Black backgrounds with neutral grey cards — zero blue tint
const DARK_PRIMARY = '#0A84FF';
const DARK_BG = '#000000';         // Pure true black
const DARK_PAPER = '#171717';      // Neutral dark grey card surface
const DARK_BORDER = '#262626';     // Subtle neutral border
const DARK_TEXT_SECONDARY = '#a3a3a3'; // Neutral grey secondary text

// Night: Material Design Mobile Night Mode
// Follows Android/Spotify/YouTube dark palette for comfortable night viewing
const NIGHT_PRIMARY = '#1DE9B6';      // Slightly calmer teal
const NIGHT_BG = '#0F1115';           // Deep Navy/Black
const NIGHT_PAPER = '#171A21';        // Elevated surface
const NIGHT_BORDER = '#252932';       // Distinct border
const NIGHT_TEXT_SECONDARY = '#8F9BB3'; // Muted secondary text

// 🎨 Billing SaaS Design Language (v1.0)
// Color System: Clarity + Trust
export const modernTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#305CDE', // Primary Blue - Main CTAs, Active states, Links
      light: '#5A80E8',
      dark: '#1E3A9F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6B7280', // Muted Text for secondary content
      light: '#9CA3AF',
      dark: '#4B5563',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626', // Error - Failed, Overdue
      light: '#EF4444',
      dark: '#B91C1C',
    },
    warning: {
      main: '#F59E0B', // Warning - Pending, Due soon
      light: '#FBBF24',
      dark: '#D97706',
    },
    success: {
      main: '#16A34A', // Success - Paid, Completed
      light: '#22C55E',
      dark: '#15803D',
    },
    info: {
      main: '#305CDE', // Info - Tips, Notes (same as primary)
      light: '#5A80E8',
      dark: '#1E3A9F',
    },
    background: {
      default: '#F8F9FA', // Light gray background (Play Store style)
      paper: '#FFFFFF', // Card / Surface
    },
    text: {
      primary: '#0F172A', // Primary Text
      secondary: '#6B7280', // Muted Text
      disabled: '#9CA3AF',
    },
    divider: '#E6E9F0', // Border / Divider
    grey: {
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '1.75rem', // 28px - Page Title
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#0F172A',
    },
    h2: {
      fontSize: '1.5rem', // 24px - Page Title
      fontWeight: 600,
      lineHeight: 1.3,
      color: '#0F172A',
    },
    h3: {
      fontSize: '1.25rem', // 20px - Section Title
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#0F172A',
    },
    h4: {
      fontSize: '1.125rem', // 18px - Section Title
      fontWeight: 600,
      lineHeight: 1.4,
      color: '#0F172A',
    },
    h5: {
      fontSize: '1rem', // 16px
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#0F172A',
    },
    h6: {
      fontSize: '0.875rem', // 14px
      fontWeight: 600,
      lineHeight: 1.5,
      color: '#0F172A',
    },
    subtitle1: {
      fontSize: '1rem', // 16px
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#0F172A',
    },
    subtitle2: {
      fontSize: '0.875rem', // 14px - Table Header
      fontWeight: 500,
      lineHeight: 1.5,
      color: '#0F172A',
    },
    body1: {
      fontSize: '0.9375rem', // 15px - Body Text
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#0F172A',
    },
    body2: {
      fontSize: '0.875rem', // 14px - Body Text
      fontWeight: 400,
      lineHeight: 1.5,
      color: '#0F172A',
    },
    button: {
      fontSize: '0.875rem', // 14px
      fontWeight: 500,
      textTransform: 'none',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.8125rem', // 13px - Metadata
      fontWeight: 400,
      lineHeight: 1.4,
      color: '#6B7280',
    },
  },
  shape: {
    borderRadius: 8, // Default for buttons and inputs
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px rgba(0, 0, 0, 0.1), 0px 4px 6px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px rgba(0, 0, 0, 0.1), 0px 10px 10px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px rgba(0, 0, 0, 0.25)',
    // ... continuing with Material-UI's default shadows
    '0px 2px 1px -1px rgba(0,0,0,0.2),0px 1px 1px 0px rgba(0,0,0,0.14),0px 1px 3px 0px rgba(0,0,0,0.12)',
    '0px 3px 1px -2px rgba(0,0,0,0.2),0px 2px 2px 0px rgba(0,0,0,0.14),0px 1px 5px 0px rgba(0,0,0,0.12)',
    '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px rgba(0,0,0,0.12)',
    '0px 2px 4px -1px rgba(0,0,0,0.2),0px 4px 5px 0px rgba(0,0,0,0.14),0px 1px 10px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 5px 8px 0px rgba(0,0,0,0.14),0px 1px 14px 0px rgba(0,0,0,0.12)',
    '0px 3px 5px -1px rgba(0,0,0,0.2),0px 6px 10px 0px rgba(0,0,0,0.14),0px 1px 18px 0px rgba(0,0,0,0.12)',
    '0px 4px 5px -2px rgba(0,0,0,0.2),0px 7px 10px 1px rgba(0,0,0,0.14),0px 2px 16px 1px rgba(0,0,0,0.12)',
    '0px 5px 5px -3px rgba(0,0,0,0.2),0px 8px 10px 1px rgba(0,0,0,0.14),0px 3px 14px 2px rgba(0,0,0,0.12)',
    '0px 5px 6px -3px rgba(0,0,0,0.2),0px 9px 12px 1px rgba(0,0,0,0.14),0px 3px 16px 2px rgba(0,0,0,0.12)',
    '0px 6px 6px -3px rgba(0,0,0,0.2),0px 10px 14px 1px rgba(0,0,0,0.14),0px 4px 18px 3px rgba(0,0,0,0.12)',
    '0px 6px 7px -4px rgba(0,0,0,0.2),0px 11px 15px 1px rgba(0,0,0,0.14),0px 4px 20px 3px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 12px 17px 2px rgba(0,0,0,0.14),0px 5px 22px 4px rgba(0,0,0,0.12)',
    '0px 7px 8px -4px rgba(0,0,0,0.2),0px 13px 19px 2px rgba(0,0,0,0.14),0px 5px 24px 4px rgba(0,0,0,0.12)',
    '0px 7px 9px -4px rgba(0,0,0,0.2),0px 14px 21px 2px rgba(0,0,0,0.14),0px 5px 26px 4px rgba(0,0,0,0.12)',
    '0px 8px 9px -5px rgba(0,0,0,0.2),0px 15px 22px 2px rgba(0,0,0,0.14),0px 6px 28px 5px rgba(0,0,0,0.12)',
    '0px 8px 10px -5px rgba(0,0,0,0.2),0px 16px 24px 2px rgba(0,0,0,0.14),0px 6px 30px 5px rgba(0,0,0,0.12)',
    '0px 8px 11px -5px rgba(0,0,0,0.2),0px 17px 26px 2px rgba(0,0,0,0.14),0px 6px 32px 5px rgba(0,0,0,0.12)',
    '0px 9px 11px -5px rgba(0,0,0,0.2),0px 18px 28px 2px rgba(0,0,0,0.14),0px 7px 34px 6px rgba(0,0,0,0.12)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Buttons: 8px
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          height: '40px',
          padding: '0 16px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeLarge: {
          height: '44px',
          fontSize: '0.9375rem',
        },
        containedPrimary: {
          backgroundColor: '#305CDE',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#1E3A9F',
          },
        },
        outlinedPrimary: {
          borderColor: '#305CDE',
          color: '#305CDE',
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: '#1E3A9F',
            backgroundColor: 'rgba(48, 92, 222, 0.04)',
          },
        },
        containedError: {
          backgroundColor: '#DC2626',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#B91C1C',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24, // Premium Play Store style (24px)
          border: 'none',
          boxShadow: '0px 2px 12px rgba(0, 0, 0, 0.04)', // Softer, more premium shadow
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8, // Inputs: 8px
            '& fieldset': {
              borderColor: '#E6E9F0',
            },
            '&:hover fieldset': {
              borderColor: '#305CDE',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#305CDE',
              borderWidth: '1px',
              boxShadow: '0 0 0 3px rgba(48, 92, 222, 0.15)',
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Cards: 12px
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16, // Modals: 16px
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          color: '#0F172A',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
          borderBottom: '1px solid #F1F5F9',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(48, 92, 222, 0.06)',
            color: '#305CDE',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
          transition: 'all 0.2s ease',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E6E9F0',
          background: '#FFFFFF',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #F1F5F9',
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: '#64748B',
          '&.Mui-selected': {
            color: '#305CDE',
          },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
        },
      },
    },
  },
});

// ─────────────────────────────────────────────────────────────────
// Shared Dark Typography — NO hardcoded color values on any variant.
// This lets MUI's palette.text.primary / secondary take full control.
// ─────────────────────────────────────────────────────────────────
const darkTypography = {
  fontFamily: [
    'Inter',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'sans-serif',
  ].join(','),
  h1: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3 },
  h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
  h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4 },
  h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
  h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
  subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
  subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
  body1: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.5 },
  body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
  button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' as const, lineHeight: 1.5 },
  caption: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.4 },
};

// Dark Theme Options (Pitch Black / Neutral Dark)
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: DARK_PRIMARY,
      light: '#5EACFF',
      dark: '#0062CC',
      contrastText: '#FFFFFF',
    },
    background: {
      default: DARK_BG,
      paper: DARK_PAPER,
    },
    text: {
      primary: '#FFFFFF',      // Pure white for maximum visibility
      secondary: '#BBBBBB',    // Clear light grey
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    action: {
      hover: 'rgba(255, 255, 255, 0.05)',
      selected: 'rgba(255, 255, 255, 0.16)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
  },
  typography: darkTypography,
  shape: modernTheme.shape,
  components: {
    ...modernTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          backgroundColor: DARK_BG,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: DARK_PRIMARY,
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#0062CC',
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.3)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.15)',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
        },
        outlinedPrimary: {
          borderColor: DARK_PRIMARY,
          color: DARK_PRIMARY,
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: DARK_PRIMARY,
            backgroundColor: 'rgba(10, 132, 255, 0.08)',
          },
          '&.Mui-disabled': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.3)',
          },
        },
        textPrimary: {
          color: DARK_PRIMARY,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
        outlinedPrimary: {
          borderColor: 'rgba(10, 132, 255, 0.3)',
          backgroundColor: 'rgba(10, 132, 255, 0.05)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.7)',
          '&.Mui-focused': {
            color: DARK_PRIMARY,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: '#FFFFFF',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.4)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: DARK_PRIMARY,
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'none',
          backgroundColor: DARK_PAPER,
          backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0))',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${DARK_BORDER}`,
          boxShadow: 'none',
          backgroundColor: DARK_PAPER,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10, 10, 10, 0.92)',
          color: '#fafafa',
          borderBottom: `1px solid ${DARK_BORDER}`,
          boxShadow: 'none',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#111111',
          borderRight: `1px solid ${DARK_BORDER}`,
          backdropFilter: 'none',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(10, 10, 10, 0.95)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          borderTop: `1px solid ${DARK_BORDER}`,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: DARK_TEXT_SECONDARY,
          '&.Mui-selected': {
            color: DARK_PRIMARY,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: DARK_PRIMARY,
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: DARK_TEXT_SECONDARY,
          '&.Mui-selected': {
            color: DARK_PRIMARY,
          },
          fontWeight: 500,
        },
      },
    },
  },
});

// Night View (Deep Midnight Blue Gradient + Cyan teal)
export const nightTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: NIGHT_PRIMARY,
      light: '#A7FFEB',
      dark: '#1DE9B6',
      contrastText: '#121212',
    },
    background: {
      default: NIGHT_BG,
      paper: NIGHT_PAPER,
    },
    text: {
      primary: '#E1E1E1',          // Soft off-white
      secondary: '#94A3B8',        // Blue-tinted grey for depth
      disabled: 'rgba(255, 255, 255, 0.38)',
    },
    action: {
      hover: 'rgba(100, 255, 218, 0.04)',
      selected: 'rgba(100, 255, 218, 0.12)',
    },
    divider: 'rgba(255, 255, 255, 0.1)',
  },
  typography: darkTypography,
  shape: modernTheme.shape,
  components: {
    ...modernTheme.components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.3s ease-in-out, color 0.3s ease-in-out',
          backgroundColor: NIGHT_BG,
          color: '#E1E1E1',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          backgroundColor: NIGHT_PRIMARY,
          color: '#121212',          // Dark text on teal button for max contrast
          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.3)',
          '&:hover': {
            backgroundColor: '#1DE9B6',
          },
          '&.Mui-disabled': {
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.3)',
          },
        },
        outlined: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: '#E1E1E1',
          '&:hover': {
            backgroundColor: 'rgba(100, 255, 218, 0.04)',
            borderColor: NIGHT_PRIMARY,
          },
        },
        outlinedPrimary: {
          borderColor: NIGHT_PRIMARY,
          color: NIGHT_PRIMARY,      // Teal text, not white, on outlined
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: NIGHT_PRIMARY,
            backgroundColor: 'rgba(29, 233, 182, 0.08)',
          },
          '&.Mui-disabled': {
            borderColor: 'rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.3)',
          },
        },
        textPrimary: {
          color: NIGHT_PRIMARY,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 600,
        },
        outlinedPrimary: {
          borderColor: 'rgba(29, 233, 182, 0.3)',
          backgroundColor: 'rgba(29, 233, 182, 0.05)',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#E1E1E1',
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: '#E1E1E1',
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: 'rgba(255, 255, 255, 0.6)',
          '&.Mui-focused': {
            color: NIGHT_PRIMARY,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: '#E1E1E1',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.3)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: NIGHT_PRIMARY,
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: 'none',
          backgroundColor: NIGHT_PAPER,
          backgroundImage: 'linear-gradient(rgba(100, 255, 218, 0.02), rgba(100, 255, 218, 0))',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: `1px solid ${NIGHT_BORDER}`,
          boxShadow: 'none',
          backgroundColor: NIGHT_PAPER,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(18, 18, 18, 0.95)',
          color: '#E1E1E1',
          borderBottom: `1px solid ${NIGHT_BORDER}`,
          boxShadow: 'none',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#181818',
          borderRight: `1px solid ${NIGHT_BORDER}`,
          backdropFilter: 'none',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(18, 18, 18, 0.97)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          borderTop: `1px solid ${NIGHT_BORDER}`,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: NIGHT_TEXT_SECONDARY,
          '&.Mui-selected': {
            color: NIGHT_PRIMARY,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: NIGHT_PRIMARY,
          height: 3,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: NIGHT_TEXT_SECONDARY,
          '&.Mui-selected': {
            color: NIGHT_PRIMARY,
          },
          fontWeight: 500,
        },
      },
    },
  },
});
