import express from 'express';
import prisma from '../../lib/prisma';
import { authenticateToken, requirePermission } from '../../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

// GET /api/admin/audit-logs?subUserId=xxx
// Returns audit logs for the admin's own scope.
// If subUserId is provided (and admin is requesting), returns that specific user's logs.
router.get('/', requirePermission('view_audit_logs'), async (req: any, res) => {
    try {
        const userId = req.user?.id;
        const { subUserId } = req.query;

        const where: any = { userId };
        if (subUserId && typeof subUserId === 'string') {
            where.subUserId = subUserId;
        }

        const logs = await (prisma as any).auditLog.findMany({
            where,
            orderBy: { timestamp: 'desc' },
            take: 200
        });

        const formattedLogs = logs.map((log: any) => {
            let description = '';
            let metadata = null;
            if (log.newData) {
                try {
                    const data = JSON.parse(log.newData);
                    if (data.description) description = data.description;
                    metadata = data;
                } catch (_) { }
            }
            if (!description) {
                description = `${log.action} on ${log.entity}`;
            }
            return {
                id: log.id,
                action: log.action,
                entity: log.entity,
                entityId: log.entityId,
                description,
                metadata,
                userName: log.userName,
                subUserId: log.subUserId,
                ipAddress: log.ipAddress,
                timestamp: log.timestamp
            };
        });

        res.json({ logs: formattedLogs });
    } catch (error: any) {
        console.error('Audit Logs Error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs', details: error.message });
    }
});

export default router;
