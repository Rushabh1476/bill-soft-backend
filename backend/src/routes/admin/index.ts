import express from 'express';
import taxRouter from './tax';
import settingsRouter from './settings';
import featureFlagsRouter from './feature-flags';
import auditLogsRouter from './audit-logs';
import usersRouter from './users';
import inviteRouter from './invite';
import logoRouter from './logo';

const router = express.Router();

// Mount sub-routers
router.use('/tax', taxRouter);
router.use('/settings', settingsRouter);
router.use('/feature-flags', featureFlagsRouter);
router.use('/audit-logs', auditLogsRouter);
router.use('/users', usersRouter);
router.use('/invite', inviteRouter);
router.use('/logo', logoRouter);

// Admin panel info endpoint
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Admin API endpoints',
    endpoints: {
      tax: {
        list: 'GET /api/admin/tax',
        create: 'POST /api/admin/tax',
        get: 'GET /api/admin/tax/:id',
        update: 'PUT /api/admin/tax/:id',
        delete: 'DELETE /api/admin/tax/:id'
      },
      settings: {
        list: 'GET /api/admin/settings',
        create: 'POST /api/admin/settings',
        userValues: 'GET/POST /api/admin/settings/user-values'
      },
      featureFlags: {
        list: 'GET /api/admin/feature-flags',
        create: 'POST /api/admin/feature-flags',
        get: 'GET /api/admin/feature-flags/:id',
        update: 'PUT /api/admin/feature-flags/:id',
        delete: 'DELETE /api/admin/feature-flags/:id'
      },
      auditLogs: {
        list: 'GET /api/admin/audit-logs'
      }
    }
  });
});

export default router;
