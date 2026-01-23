import { createTheme } from '@mui/material/styles';

export const modernTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3B82F6',
      light: '#60A5FA',
      dark: '#1E40AF',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#6366F1',
      light: '#818CF8',
      dark: '#4338CA',
      contrastText: '#FFFFFF',
    },
    error: { main: '#EF4444' },
    warning: { main: '#F59E0B' },
    success: { main: '#10B981' },
    info: { main: '#3B82F6' },
    background: {
      default: '#FAFBFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      disabled: '#9CA3AF',
    },
    divider: '#E5E7EB',
  },

  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },

  shape: {
    borderRadius: 8,
  },

  components: {
    /* =========================
       ALL BUTTONS (GLOBAL)
       ========================= */
    MuiButton: {
      defaultProps: {
        disableRipple: true,
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          backgroundColor: '#1E3A8A',
          color: '#FFFFFF',
          transition: 'background-color 0.05s linear',
          boxShadow: 'none',
          outline: 'none',

          '&:hover': {
            backgroundColor: '#1E3A8A',
          },
          '&:active': {
            backgroundColor: '#1E3A8A',
          },
        },
      },
    },

    /* =========================
       SIDEBAR BUTTONS
       ========================= */
    MuiListItemButton: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '6px 10px',
          padding: '10px 14px',
          backgroundColor: 'transparent',
          transition: 'background-color 0.05s linear',

          '&:hover': {
            backgroundColor: '#1E3A8A',
          },

          '&.Mui-selected': {
            backgroundColor: '#1E3A8A',
          },

          '&.Mui-selected:hover': {
            backgroundColor: '#1E3A8A',
          },
        },
      },
    },

    /* =========================
       SIDEBAR ICONS
       ========================= */
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          minWidth: 36,
          color: '#475569',

          '.MuiListItemButton-root:hover &': {
            color: '#FFFFFF',
          },

          '.Mui-selected &': {
            color: '#FFFFFF',
          },
        },
      },
    },

    /* =========================
       SIDEBAR TEXT
       ========================= */
    MuiListItemText: {
      styleOverrides: {
        primary: {
          color: '#475569',
          fontWeight: 500,

          '.MuiListItemButton-root:hover &': {
            color: '#FFFFFF',
          },

          '.Mui-selected &': {
            color: '#FFFFFF',
            fontWeight: 600,
          },
        },
      },
    },

    /* =========================
       USER AVATAR (U)
       ========================= */
    MuiAvatar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E3A8A',
          color: '#FFFFFF',
          fontWeight: 600,
        },
      },
    },

    /* =========================
       SETTINGS TABS
       ========================= */
    MuiTab: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontWeight: 700,
          minHeight: 44,
          color: '#475569',
          transition: 'background-color 0.05s linear',

          '& .MuiTab-iconWrapper': {
            color: '#475569',
          },

          '&.Mui-selected': {
            backgroundColor: '#1E3A8A',
            color: '#FFFFFF',

            '& .MuiTab-iconWrapper': {
              color: '#FFFFFF',
            },
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #E5E7EB',
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E5E7EB',
          background: '#FFFFFF',
        },
      },
    },
  },
});

/* DARK THEME UNCHANGED */
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#F8FAFC',
      secondary: '#CBD5E1',
    },
  },
});
