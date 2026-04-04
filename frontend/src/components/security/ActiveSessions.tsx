/* eslint-disable */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  Skeleton,
} from '@mui/material';
import {
  PhonelinkRing as DeviceIcon,
  Computer as DesktopIcon,
  PhoneIphone as PhoneIcon,
  Tablet as TabletIcon,
  SecurityOutlined as SecurityIcon,
  LogoutOutlined as LogoutIcon,
  Refresh as RefreshIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  FiberManualRecord as ActiveDotIcon,
} from '@mui/icons-material';
import { sessionService, UserSession } from '../../services/sessionService';

// ─── Helper: Detect Device Type ──────────────────────────────────────────────

const getDeviceType = (deviceInfo: string | null, userAgent: string | null): 'mobile' | 'tablet' | 'desktop' | 'unknown' => {
  const info = `${deviceInfo || ''} ${userAgent || ''}`.toLowerCase();
  if (info.includes('ipad') || info.includes('tablet')) return 'tablet';
  if (info.includes('mobile') || info.includes('ios') || info.includes('android') || info.includes('iphone')) return 'mobile';
  if (info.includes('windows') || info.includes('mac') || info.includes('linux')) return 'desktop';
  return 'unknown';
};

const DeviceIcon2: React.FC<{ deviceInfo: string | null; userAgent: string | null; active?: boolean }> = ({ deviceInfo, userAgent, active }) => {
  const type = getDeviceType(deviceInfo, userAgent);
  const theme = useTheme();
  const bgColor = active
    ? (theme.palette.mode === 'dark' ? 'rgba(34, 197, 94, 0.15)' : '#dcfce7')
    : (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : '#f1f5f9');
  const iconColor = active ? '#16a34a' : theme.palette.text.secondary;

  return (
    <Box sx={{
      width: 52,
      height: 52,
      borderRadius: 3,
      bgcolor: bgColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      border: active ? '1.5px solid #86efac' : '1.5px solid transparent',
      transition: 'all 0.2s',
    }}>
      {type === 'mobile' && <PhoneIcon sx={{ color: iconColor, fontSize: 26 }} />}
      {type === 'tablet' && <TabletIcon sx={{ color: iconColor, fontSize: 26 }} />}
      {type === 'desktop' && <DesktopIcon sx={{ color: iconColor, fontSize: 26 }} />}
      {type === 'unknown' && <DeviceIcon sx={{ color: iconColor, fontSize: 26 }} />}
    </Box>
  );
};

// ─── Helper: Format relative time ────────────────────────────────────────────

const formatRelativeTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ActiveSessions: React.FC = () => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const loadSessions = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await sessionService.getSessions();
      setSessions(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not load active sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    setError('');
    try {
      await sessionService.revokeSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSuccessMsg('Device signed out successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setError('Failed to sign out that device. Please try again.');
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm('Sign out all other devices? You will remain logged in on this device.')) return;
    const others = sessions.slice(1); // All except current (index 0)
    setError('');
    try {
      await Promise.all(others.map(s => sessionService.revokeSession(s.id)));
      setSessions(prev => [prev[0]]); // Keep only current
      setSuccessMsg('All other devices have been signed out.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch {
      setError('Failed to sign out some devices. Please try again.');
    }
  };

  return (
    <Card sx={{
      mt: 3,
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
    }} elevation={0}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>

        {/* ── Header ── */}
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 2,
              bgcolor: isDark ? 'rgba(48,92,222,0.15)' : 'rgba(48,92,222,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SecurityIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Active Sessions
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sessions.length} device{sessions.length !== 1 ? 's' : ''} logged in
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
            <Tooltip title="Refresh list">
              <IconButton size="small" onClick={loadSessions} disabled={loading}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {sessions.length > 1 && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<LogoutIcon />}
                onClick={handleRevokeAll}
                sx={{ borderRadius: 2, fontSize: '0.78rem', flexGrow: { xs: 1, sm: 0 } }}
              >
                Sign Out All Others
              </Button>
            )}
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          These are the devices currently signed into your account. If you notice something suspicious, sign out that device immediately and change your password.
        </Typography>

        {/* ── Alerts ── */}
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}

        {/* ── Loading (Skeleton UI) ── */}
        {loading && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {[1, 2].map((i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#fafafa'),
                }}
              >
                <Skeleton variant="rounded" width={52} height={52} sx={{ borderRadius: 3, flexShrink: 0 }} />
                <Box sx={{ flex: 1, ml: 2 }}>
                  <Skeleton variant="text" width="40%" height={24} sx={{ mb: 0.5 }} />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Skeleton variant="text" width="20%" height={16} />
                    <Skeleton variant="text" width="20%" height={16} />
                  </Box>
                  <Skeleton variant="text" width="60%" height={16} sx={{ mt: 0.3 }} />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* ── Session List ── */}
        {!loading && sessions.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <DeviceIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1.5 }} />
            <Typography variant="body1" color="text.secondary">No active sessions found.</Typography>
          </Box>
        )}

        {!loading && sessions.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {sessions.map((session, index) => {
              const isCurrent = index === 0;
              const isRevoking = revoking === session.id;

              return (
                <Box
                  key={session.id}
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 2, sm: 0 },
                    p: { xs: 2, sm: 2 },
                    borderRadius: 2.5,
                    border: '1px solid',
                    borderColor: isCurrent
                      ? (isDark ? 'rgba(34,197,94,0.3)' : '#bbf7d0')
                      : 'divider',
                    bgcolor: isCurrent
                      ? (isDark ? 'rgba(34,197,94,0.05)' : '#f0fdf4')
                      : (isDark ? 'rgba(255,255,255,0.02)' : '#fafafa'),
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: isCurrent ? (isDark ? 'rgba(34,197,94,0.5)' : '#86efac') : 'primary.light',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    },
                  }}
                >
                  {/* Device Icon */}
                  <DeviceIcon2 deviceInfo={session.deviceInfo} userAgent={session.userAgent} active={isCurrent} />

                  {/* Session Details */}
                  <Box sx={{ flex: 1, minWidth: 0, mx: { xs: 0, sm: 2 } }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {session.deviceInfo || 'Unknown Device'}
                      </Typography>
                      {isCurrent && (
                        <Chip
                          icon={<ActiveDotIcon sx={{ fontSize: '10px !important', color: '#16a34a !important' }} />}
                          label="This device"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: isDark ? 'rgba(34,197,94,0.15)' : '#dcfce7',
                            color: '#16a34a',
                            border: '1px solid #86efac',
                            '& .MuiChip-icon': { ml: 0.5 },
                          }}
                        />
                      )}
                    </Box>

                    {/* Meta info row */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: { xs: 1.5, sm: 2 }, alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <LocationIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary">
                          {session.ipAddress || 'Unknown IP'}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                        <TimeIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(session.lastUsedAt)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Browser - truncated */}
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{
                        display: 'block',
                        mt: 0.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: { xs: '100%', sm: 380 }
                      }}
                      title={session.userAgent || ''}
                    >
                      {session.userAgent || 'Unknown browser'}
                    </Typography>
                  </Box>

                  {/* Action */}
                  {!isCurrent && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      disabled={isRevoking}
                      onClick={() => handleRevoke(session.id)}
                      sx={{
                        borderRadius: 2,
                        fontSize: '0.78rem',
                        minWidth: 90,
                        alignSelf: { xs: 'stretch', sm: 'center' },
                        flexShrink: 0,
                      }}
                    >
                      {isRevoking ? <CircularProgress size={14} /> : 'Sign Out'}
                    </Button>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};
