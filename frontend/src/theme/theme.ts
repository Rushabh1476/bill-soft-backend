import { createTheme, alpha } from '@mui/material/styles';

// Theme Color Constants (Pitch Black / Neutral Dark)
// Dark: Pure Black backgrounds with neutral grey cards — zero blue tint
const DARK_PRIMARY = '#0A84FF';
const DARK_BG = '#000000';         // Pure true black
const DARK_PAPER = '#171717';      // Neutral dark grey card surface
const DARK_BORDER = '#262626';     // Subtle neutral border

// Night: Slate Navy & Teal Palette (Optimized for Deep Midnight visibility)
// A premium dark-blue mode that contrasts perfectly with the Pure Black Dark mode
const NIGHT_PRIMARY = '#2DD4BF';      // Popti Green (Teal 400 - Matching Preview)
const NIGHT_BG = '#0F1115';           // Deep Navy/Black
const NIGHT_PAPER = '#171A21';        // Elevated surface
const NIGHT_BORDER = '#252932';       // Distinct border
// 🎨 Billing SaaS Design Language (v1.0)
// Color System: Clarity + Trust
export const getModernTheme = (primaryColor: string = '#3b82f6') => createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: primaryColor,
      light: '#5A80E8',
      dark: '#1D3BB5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6B7280',
      light: '#9CA3AF',
      dark: '#4B5563',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    success: {
      main: '#16A34A',
      light: '#22C55E',
      dark: '#15803D',
    },
    info: {
      main: primaryColor,
      light: `${primaryColor}aa`,
      dark: `${primaryColor}ee`,
    },
    background: {
      default: '#F8F9FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
    },
    divider: '#E6E9F0',
  },
  typography: {
    fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
    h1: { fontSize: '1.75rem', fontWeight: 600, lineHeight: 1.3, color: '#0F172A' },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3, color: '#0F172A' },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4, color: '#0F172A' },
    h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.4, color: '#0F172A' },
    h5: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5, color: '#0F172A' },
    h6: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5, color: '#0F172A' },
    subtitle1: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5, color: '#0F172A' },
    subtitle2: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5, color: '#0F172A' },
    body1: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.5, color: '#0F172A' },
    body2: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5, color: '#0F172A' },
    button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none', lineHeight: 1.5 },
    caption: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.4, color: '#6B7280' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
        },
        outlined: {
          backgroundColor: alpha(primaryColor, 0.04),
          borderColor: alpha(primaryColor, 0.2),
          color: primaryColor,
          '&:hover': {
            backgroundColor: alpha(primaryColor, 0.08),
            borderColor: alpha(primaryColor, 0.4),
          },
        },
        text: {
          color: primaryColor,
          backgroundColor: alpha(primaryColor, 0.02),
          '&:hover': {
            backgroundColor: alpha(primaryColor, 0.06),
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: `0 4px 12px ${alpha(primaryColor, 0.2)}`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          borderRight: '1px solid #E6E9F0',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderBottom: '1px solid #F1F5F9',
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
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: '#E6E9F0' },
          },
        },
      },
    },

    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
        },
      },
    },
  },
});

const darkTypography = {
  fontFamily: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'].join(','),
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
  button: { fontSize: '0.875rem', fontWeight: 600, textTransform: 'none' as const, lineHeight: 1.5 },
  caption: { fontSize: '0.8125rem', fontWeight: 400, lineHeight: 1.4 },
};

export const getDarkTheme = (primaryColor: string = DARK_PRIMARY) => createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: primaryColor,
      light: `${primaryColor}aa`,
      dark: `${primaryColor}ee`,
      contrastText: '#FFFFFF',
    },
    background: {
      default: DARK_BG,
      paper: DARK_PAPER,
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#A3A3A3',
      disabled: '#404040',
    },
    divider: DARK_BORDER,
    action: {
      hover: 'rgba(255, 255, 255, 0.05)',
      selected: 'rgba(255, 255, 255, 0.1)',
    },
  },
  typography: darkTypography as any,
  shape: { borderRadius: 8 },
  components: {
    ...getModernTheme(primaryColor).components,
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
          backgroundColor: DARK_BG,
          color: '#FFFFFF',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: DARK_BG,
          backgroundImage: 'none',
          color: '#FFFFFF',
          borderBottom: `1px solid ${DARK_BORDER}`,
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: DARK_BG,
          borderRight: `1px solid ${DARK_BORDER}`,
          backgroundImage: 'none',
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          backgroundColor: DARK_BG,
          borderTop: `1px solid ${DARK_BORDER}`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: DARK_PAPER,
          borderRadius: 16,
          backgroundImage: 'none',
          border: `1px solid ${DARK_BORDER}`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: DARK_BORDER },
            '&:hover fieldset': { borderColor: primaryColor },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: DARK_PAPER,
          backgroundImage: 'none',
        },
      },
    },
  },
});

export const getNightTheme = (primaryColorProp: string = NIGHT_PRIMARY) => {
  // Fix: Ensure the 'popti' green is applied when Night mode is selected, 
  // even if the global primary color is set to the default blue.
  const effectivePrimary = primaryColorProp === '#3b82f6' ? NIGHT_PRIMARY : primaryColorProp;
  
  return createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: effectivePrimary,
        light: '#5EEAD4',
        dark: '#0D9488',
        contrastText: '#0F172A',
      },
      background: {
        default: NIGHT_BG,
        paper: NIGHT_PAPER,
      },
      text: {
        primary: '#E1E1E1',
        secondary: '#94A3B8',
        disabled: '#2E323A',
      },
      divider: NIGHT_BORDER,
    },
    typography: darkTypography as any,
    shape: { borderRadius: 8 },
    components: {
      ...getModernTheme(effectivePrimary).components,
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
            backgroundColor: NIGHT_BG,
            color: '#E1E1E1',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: NIGHT_BG,
            backgroundImage: 'none',
            color: '#E1E1E1',
            borderBottom: `1px solid ${NIGHT_BORDER}`,
            boxShadow: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: NIGHT_BG,
            borderRight: `1px solid ${NIGHT_BORDER}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              backgroundColor: 'rgba(45, 212, 191, 0.12)', // Subtle Night primary background (2DD4BF)
              color: effectivePrimary,
              borderLeft: `4px solid ${effectivePrimary}`,
              '&:hover': {
                backgroundColor: 'rgba(45, 212, 191, 0.2)',
              },
              '& .MuiListItemIcon-root': { color: effectivePrimary },
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            color: NIGHT_BORDER,
            '&.Mui-checked': {
              color: effectivePrimary,
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 600,
            '&.MuiButton-containedPrimary': {
              backgroundColor: effectivePrimary,
              color: '#0F172A',
              '&:hover': {
                backgroundColor: '#5EEAD4',
              },
            },
            '&.MuiButton-outlinedPrimary': {
              borderColor: effectivePrimary,
              color: effectivePrimary,
              '&:hover': {
                backgroundColor: 'rgba(45, 212, 191, 0.08)',
                borderColor: '#5EEAD4',
              },
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: NIGHT_BG,
            borderTop: `1px solid ${NIGHT_BORDER}`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: NIGHT_PAPER,
            borderRadius: 16,
            backgroundImage: 'none',
            border: `1px solid ${NIGHT_BORDER}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 8,
              '& fieldset': { borderColor: NIGHT_BORDER },
              '&:hover fieldset': { borderColor: effectivePrimary },
              '&.Mui-focused fieldset': { borderColor: effectivePrimary },
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: NIGHT_PAPER,
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};

export const modernTheme = getModernTheme();
export const darkTheme = getDarkTheme();
export const nightTheme = getNightTheme();
