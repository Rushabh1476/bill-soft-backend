import express from 'express';
import crypto from 'crypto';
import { authenticateToken, requirePermission } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { sendInvitationEmail } from '../../services/emailService/mailService';
import { getBaseUrl } from '../../lib/baseUrl';

const router = express.Router();

router.use(authenticateToken);
router.use(requirePermission('manage_users'));

// Get all users created by this Admin (Team Members)
router.get('/', async (req: any, res) => {
    try {
        const userId = req.user.id;
        const users = await prisma.user.findMany({
            where: {
                parent: { id: userId }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                permissions: true,
                isActive: true,
                isEmployee: true,
                createdAt: true,
                lastLoginAt: true,
                role: {
                    select: { name: true }
                }
            } as any
        });

        const mappedUsers = users.map((user: any) => ({
            id: user.id,
            name: user.name || '',
            email: user.email,
            phone: user.phone || '',
            role: user.role?.name?.toUpperCase() || 'VIEWER',
            status: user.isActive ? 'active' : 'inactive',
            isEmployee: !!user.isEmployee,
            createdAt: user.createdAt.toISOString().split('T')[0],
            lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
            permissions: user.permissions ? JSON.parse(user.permissions as any) : []
        }));

        res.json({ success: true, count: mappedUsers.length, data: mappedUsers });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Add a new user (direct — sets password immediately)
router.post('/', async (req: any, res) => {
    try {
        const { name, email, password, role, permissions, phone, isEmployee } = req.body;
        const parentId = req.user.id;

        const { validateEmail } = require('../../lib/validation');
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ error: emailValidation.error });
        }

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        if (phone && !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits and start with 6, 7, 8, or 9' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email already exists' });
        }

        const { hashPassword } = await import('../../lib/auth');
        // Invitation flow: token instead of direct password
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const tokenExpiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        let allRoles = await prisma.role.findMany();

        // Auto-seed basic roles if none exist (emergency fix)
        if (allRoles.length === 0) {
            console.warn('[AdminAPI] ⚠️ No roles found. Seeding default roles...');
            const defaultRoles = [
                { name: 'ADMIN', displayName: 'Administrator' },
                { name: 'MANAGER', displayName: 'Manager' },
                { name: 'ACCOUNTANT', displayName: 'Accountant' },
                { name: 'FINANCE', displayName: 'Finance' },
                { name: 'OPERATOR', displayName: 'Operator' },
                { name: 'TECHNICIAN', displayName: 'Technician' },
                { name: 'VIEWER', displayName: 'Viewer' },
                { name: 'READONLY', displayName: 'Read Only' }
            ];

            for (const r of defaultRoles) {
                try {
                    // Try to use string directly, but ensure it matches UserRole Enum
                    await (prisma.role as any).upsert({
                        where: { name: r.name },
                        update: {},
                        create: { name: r.name, displayName: r.displayName }
                    });
                } catch (e: any) {
                    console.error(`[AdminAPI] ❌ Failed to seed role ${r.name}:`, e.message);
                }
            }
            allRoles = await prisma.role.findMany();
            console.log('[AdminAPI] 📊 Available roles after seeding:', allRoles.map(r => r.name));
        }

        // Proactive Role Selection & Seeding
        const targetRoleName = (role || 'VIEWER').toUpperCase().trim();
        let roleObj = allRoles.find(r => r.name.toUpperCase() === targetRoleName);

        if (!roleObj) {
            console.warn(`[AdminAPI] ⚠️ Role ${targetRoleName} not found. Attempting to ensure existence...`);
            // Ensure the specific target role exists
            try {
                roleObj = await (prisma.role as any).upsert({
                    where: { name: targetRoleName },
                    update: {},
                    create: { name: targetRoleName, displayName: targetRoleName.charAt(0) + targetRoleName.slice(1).toLowerCase() }
                });
            } catch (e) {
                console.error(`[AdminAPI] ❌ Failed to ensure role ${targetRoleName}:`, e);
                // Last resort fallback
                roleObj = allRoles.find(r => r.name.toUpperCase() === 'VIEWER') || allRoles[0];
            }
        }

        // Build create-compatible data object
        const userData: any = {
            name,
            email: normalizedEmail,
            password: await hashPassword(crypto.randomBytes(16).toString('hex')),
            phone: phone || null,
            permissions: JSON.stringify(permissions || []),
            isActive: false,
            isEmployee: isEmployee ? 1 : 0,
            invitationToken,
            passwordSet: false,
        };

        // Use nested relations instead of scalar FKs to avoid Prisma validation errors
        if (roleObj) {
            userData.role = { connect: { id: roleObj.id } };
        }

        if (parentId) {
            userData.parent = { connect: { id: parentId } };
        }

        const newUser = await prisma.user.create({
            data: userData,
            include: { role: true }
        });

        // Trigger invitation email ASYNCHRONOUSLY (don't let SMTP failures block user creation)
        console.log(`[AdminAPI] 📧 Attempting invitation dispatch for ${normalizedEmail}...`);

        let inviteSent = false;
        let inviteError = null;

        try {
            const roleForEmail = roleObj?.name || role || 'VIEWER';
            // We call this but we don't strictly NEED to wait for it for the DB operation to be considered 'done'
            // However, for better UX we can wait and just catch the error.
            const resolvedBaseUrl = getBaseUrl(req);
            await sendInvitationEmail(normalizedEmail, name, invitationToken, roleForEmail, resolvedBaseUrl);
            console.log(`[AdminAPI] ✅ Invitation successfully reached SMTP for ${normalizedEmail}`);
            inviteSent = true;
        } catch (mailErr: any) {
            console.error(`[AdminAPI] ❌ Invitation email failed for ${normalizedEmail}:`, mailErr.message);
            inviteError = mailErr.message;
        }

        // Send Admin System Alert (Crucial Activity)
        (async () => {
            try {
                // Check setting for Admin System Alerts
                const alertSetting = await prisma.settings.findFirst({
                    where: { key: 'admin_system_alerts' }
                });

                const isAlertEnabled = alertSetting && JSON.parse(alertSetting.value as string) === true;
                
                if (isAlertEnabled && parentId) {
                    const { sendAdminSystemAlertEmail } = require('../../services/emailService');
                    const primaryAdmin = await prisma.user.findUnique({
                        where: { id: parentId },
                        select: { email: true, name: true }
                    });

                    if (primaryAdmin?.email) {
                        await sendAdminSystemAlertEmail(
                            primaryAdmin.email,
                            'New Team Member Invited',
                            `A new user account for ${name} (${normalizedEmail}) with role ${roleObj?.name || 'VIEWER'} has been successfully created.`,
                            req.user?.name || 'System Administrator'
                        );
                    }
                }
            } catch (err) {
                console.error('[AdminAlerts] Failed to process system alert:', err);
            }
        })();

        res.status(201).json({
            success: true,
            message: inviteSent 
                ? 'User added and invitation email sent successfully.' 
                : 'User added to database, but the invitation email could not be sent. Please check SMTP settings.',
            mailError: inviteError,
            data: {
                id: (newUser as any).id,
                name: (newUser as any).name,
                email: (newUser as any).email,
                role: (newUser as any).role?.name,
                status: 'pending',
                isEmployee: !!(newUser as any).isEmployee
            }
        });

    } catch (error: any) {
        console.error('Error creating user/invitation:', error);
        res.status(500).json({ error: error.message || 'Failed to create user' });
    }
});

// Update user permissions and role
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { role, permissions, name, phone, status, isEmployee } = req.body;

        if (phone && !/^[6-9]\d{9}$/.test(phone)) {
            return res.status(400).json({ error: 'Phone must be 10 digits and start with 6, 7, 8, or 9' });
        }

        let roleObj;
        if (role) {
            try {
                const allRoles = await prisma.role.findMany();
                const targetRoleName = role.toUpperCase();
                roleObj = allRoles.find(r => r.name.toUpperCase() === targetRoleName);

                // Fail-safe: if they sent a role but it doesn't exist, we don't want to break the user record, 
                // but we might want a fallback if the user currently has NO role.
                if (!roleObj && allRoles.length > 0) {
                    console.warn(`[AdminAPI] Attempted to assign role ${targetRoleName} which doesn't exist. Skipping role update or using fallback.`);
                }
            } catch (e) {
                console.warn(`Attempted to assign invalid role: ${role}`);
            }
        }

        const updateData: any = {
            name,
            phone,
        };

        if (status) {
            updateData.isActive = (status === 'active');
        }

        if (typeof isEmployee === 'boolean') { 
            updateData.isEmployee = isEmployee ? 1 : 0; 
        }

        if (permissions) {
            updateData.permissions = JSON.stringify(permissions);
        }

        if (roleObj) {
            updateData.role = { connect: { id: roleObj.id } };
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { role: true }
        });

        // Map back to the frontend expected format
        const mappedUser = {
            id: updatedUser.id,
            name: updatedUser.name || '',
            email: updatedUser.email,
            phone: updatedUser.phone || '',
            role: (updatedUser as any).role?.name?.toUpperCase() || 'VIEWER',
            status: updatedUser.isActive ? 'active' : 'inactive',
            isEmployee: (updatedUser as any).isEmployee,
            createdAt: updatedUser.createdAt.toISOString().split('T')[0],
            permissions: updatedUser.permissions ? JSON.parse(updatedUser.permissions) : []
        };

        res.json({
            success: true,
            message: 'User updated successfully',
            data: mappedUser
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user (No more Ghost Data)
router.delete('/:id', async (req: any, res) => {
    try {
        const { id } = req.params;
        const parentId = req.user.id;

        const userToDelete = await prisma.user.findFirst({
            where: {
                id: id,
                parent: { id: parentId }
            }
        });

        if (!userToDelete) {
            return res.status(404).json({ error: 'User not found or access denied' });
        }

        await prisma.user.delete({ where: { id: id } });

        res.json({ success: true, message: 'User permanently removed from the system' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get detailed activity history for a specific sub-user
router.get('/:id/history', async (req: any, res) => {
    try {
        const { id } = req.params;
        const parentId = req.user.id;

        const teamMember = await prisma.user.findFirst({
            where: { id: id, parentId: parentId }
        });

        if (!teamMember) {
            return res.status(404).json({ error: 'User not found or access denied' });
        }

        const logs = await prisma.auditLog.findMany({
            where: { subUserId: id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Error fetching user history:', error);
        res.status(500).json({ error: 'Failed to fetch activity history' });
    }
});

export default router;
