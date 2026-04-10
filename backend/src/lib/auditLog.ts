
import prisma from './prisma';

interface AuditLogParams {
    userId?: string;     // scope: the main account ID (Admin/Owner)
    subUserId?: string;  // actor: the actual user ID (e.g. staff)
    userName?: string;   // actor name snapshot
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'BULK_CREATE' | 'BULK_DELETE';
    entity: string;
    entityId?: string;
    description: string;
    req?: any; // To extract IP and User Agent
    oldData?: any;
    newData?: any;
    prismaClient?: any; // Optional transaction client
}

export const recordAuditLog = async (params: AuditLogParams) => {
    try {
        let { userId, subUserId, userName, action, entity, entityId, description, req, oldData, newData, prismaClient } = params;

        // Determine status and color based on action type
        const statusType = (action as string).includes('DELETE') ? 'danger' : ((action as string).includes('CREATE') || (action as string).includes('LOGIN') ? 'success' : 'info');
        const statusColor = statusType === 'danger' ? '#ef4444' : (statusType === 'success' ? '#10b981' : '#3b82f6');


        // Determine client to use (transaction or global)
        const db = prismaClient || prisma;

        // Extract actor details from request if not provided
        if (req && req.user) {
            userId = userId || req.user.orgId;
            subUserId = subUserId || req.user.id;
            userName = userName || req.user.name || req.user.email;
        }

        // Extract IP and User Agent
        let ipAddress = 'Unknown';
        let userAgent = 'Unknown';

        if (req) {
            const xForwardedFor = req.headers['x-forwarded-for'];
            if (typeof xForwardedFor === 'string') {
                ipAddress = xForwardedFor.split(',')[0].trim();
            } else if (Array.isArray(xForwardedFor)) {
                ipAddress = xForwardedFor[0];
            } else {
                ipAddress = req.socket?.remoteAddress || req.ip || 'Unknown';
            }
            userAgent = req.headers['user-agent'] || 'Unknown';
        }

        const metaData = {
            description,
            statusType,
            statusColor,
            ...(newData || {})
        };

        console.log(`[AuditLog] Recording ${action} by ${userName || 'System'} on ${entity}: ${description}`);

        await (db as any).auditLog.create({
            data: {
                userId,
                subUserId,
                userName,
                action,
                entity,
                entityId,
                ipAddress,
                userAgent,
                oldData: oldData ? JSON.stringify(oldData) : null,
                newData: JSON.stringify(metaData),
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
    }
};

export const createAuditLog = async (params: any) => {
    return recordAuditLog({
        ...params,
        req: { ip: params.ipAddress, headers: { 'user-agent': params.userAgent } }
    });
}
