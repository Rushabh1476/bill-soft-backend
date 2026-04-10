import express from 'express';
import crypto from 'crypto';
import { authenticateToken, requirePermission } from '../../middleware/auth';
import prisma from '../../lib/prisma';
import { sendInvitationEmail } from '../../services/emailService/mailService';
import { getBaseUrl } from '../../lib/baseUrl';

const router = express.Router();

// ─── POST /api/admin/invite ───────────────────────────────────────────────────
// Admin invites a new user. Creates user record (passwordSet=false) + sends email.
router.post('/', authenticateToken, requirePermission('manage_users'), async (req: any, res) => {
    try {
        const { name, email, role, permissions, phone } = req.body;
        const parentId = req.user.id;

        const { validateEmail } = require('../../lib/validation');
        const emailValidation = validateEmail(email);
        if (!emailValidation.isValid) {
            return res.status(400).json({ error: emailValidation.error });
        }

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();

        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }

        // Generate a cryptographically secure invitation token
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

        const { hashPassword } = await import('../../lib/auth');
        const placeholderHash = await hashPassword(crypto.randomBytes(16).toString('hex'));

        let allRoles = await prisma.role.findMany();

        // Auto-seed basic roles if none exist (emergency fix)
        if (allRoles.length === 0) {
            console.warn('[INVITE] ⚠️ No roles found. Seeding default roles...');
            const defaultRoles = [
                { name: 'ADMIN', displayName: 'Administrator' },
                { name: 'MANAGER', displayName: 'Manager' },
                { name: 'ACCOUNTANT', displayName: 'Accountant' },
                { name: 'FINANCE', displayName: 'Finance' },
                { name: 'OPERATOR', displayName: 'Operator' },
                { name: 'VIEWER', displayName: 'Viewer' }
            ];

            for (const r of defaultRoles) {
                try {
                    await (prisma.role as any).upsert({
                        where: { name: r.name },
                        update: {},
                        create: { name: r.name, displayName: r.displayName }
                    });
                } catch (e) {
                    console.error(`Failed to seed role ${r.name}:`, e);
                }
            }
            allRoles = await prisma.role.findMany();
        }

        const targetRoleName = (role || 'VIEWER').toUpperCase();
        let roleObj = allRoles.find(r => r.name.toUpperCase() === targetRoleName);

        if (!roleObj) {
            console.warn(`[INVITE] Role ${targetRoleName} not found. Ensuring existence...`);
            try {
                roleObj = await (prisma.role as any).upsert({
                    where: { name: targetRoleName },
                    update: {},
                    create: { name: targetRoleName, displayName: targetRoleName.charAt(0) + targetRoleName.slice(1).toLowerCase() }
                });
            } catch (e) {
                roleObj = allRoles.find(r => r.name.toUpperCase() === 'VIEWER') || allRoles[0];
            }
        }

        const userData: any = {
            name,
            email: normalizedEmail,
            password: placeholderHash,
            phone: phone || null,
            permissions: JSON.stringify(permissions || []),
            isActive: false,
            invitationToken: token,
            invitationExpiry: expiry,
            passwordSet: false,
        };

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

        // Use centralized mail service with premium deliverability features
        let inviteSent = false;
        let inviteError = null;

        try {
            const roleForEmail = roleObj?.name || role || 'VIEWER';
            const resolvedBaseUrl = getBaseUrl(req);
            await sendInvitationEmail(normalizedEmail, name, token, roleForEmail, resolvedBaseUrl);
            console.log(`[INVITE] ✅ Invitation DISPATCHED to ${normalizedEmail}`);
            inviteSent = true;
        } catch (mailErr: any) {
            console.error(`[INVITE] ❌ SMTP failure for ${normalizedEmail}:`, mailErr.message);
            inviteError = mailErr.message;
        }

        res.status(201).json({
            success: true,
            message: inviteSent 
                ? `Invitation successfully sent to ${normalizedEmail}` 
                : `User record created, but invitation email to ${normalizedEmail} failed. Please verify SMTP settings.`,
            mailError: inviteError,
            userId: newUser.id
        });

    } catch (error: any) {
        console.error('Invite error:', error);
        res.status(500).json({ error: 'Failed to process invitation', detail: error.message });
    }
});

// ─── GET /api/admin/invite/validate?token=xxx ─────────────────────────────────
// Public: verifies token validity before showing the setup-password page
router.get('/validate', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token || typeof token !== 'string') {
            return res.status(400).json({ valid: false, error: 'Token is required' });
        }

        const user = await (prisma.user as any).findUnique({
            where: { invitationToken: token },
            select: { id: true, name: true, email: true, invitationExpiry: true, passwordSet: true }
        });

        if (!user) return res.status(404).json({ valid: false, error: 'Invalid invitation link' });

        // Removed: premature passwordSet check. Link remains active until first successful password save.

        if (user.invitationExpiry && new Date(user.invitationExpiry) < new Date()) {
            return res.status(400).json({ valid: false, error: 'This invitation link has expired' });
        }

        res.json({ valid: true, name: user.name, email: user.email });
    } catch (error: any) {
        res.status(500).json({ valid: false, error: error.message });
    }
});

// ─── POST /api/admin/invite/setup-password ────────────────────────────────────
// Public: sets the password for an invited user
router.post('/setup-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const user = await (prisma.user as any).findUnique({
            where: { invitationToken: token }
        });

        console.log(`[SETUP-PASSWORD] 🛡️ Validation: User found=${!!user}, email=${user?.email}`);

        if (!user) return res.status(404).json({ error: 'Invalid invitation link' });

        // Removed: redundant passwordSet check. Nulling the token on success already handles one-time use.
        if (user.invitationExpiry && new Date(user.invitationExpiry) < new Date()) {
            return res.status(400).json({ error: 'This invitation link has expired' });
        }

        const { hashPassword } = await import('../../lib/auth');
        const hashedPassword = await hashPassword(password);

        await (prisma.user as any).update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordSet: true,
                invitationToken: null,
                invitationExpiry: null,
                isActive: true,
                lastLoginAt: new Date(),
            }
        });

        res.json({ success: true, message: 'Password set successfully. You can now log in.' });
    } catch (error: any) {
        console.error('Setup password error:', error);
        res.status(500).json({ error: 'Failed to set password', detail: error.message });
    }
});

// ─── GET /api/admin/invite/permissions/:userId ────────────────────────────────
// Authenticated: returns live permissions for a sub-user (for real-time sync polling)
router.get('/permissions/:userId', authenticateToken, async (req: any, res) => {
    try {
        const { userId } = req.params;
        const requestingUser = req.user;

        // Allow: the sub-user fetching their own permissions, OR the admin
        const isAdmin = requestingUser.role?.name?.toUpperCase() === 'ADMIN';
        const isSelf = requestingUser.id === userId;

        if (!isAdmin && !isSelf) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { role: { select: { name: true } } }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        let permissions: string[] = [];
        try { permissions = JSON.parse(user.permissions || '[]'); } catch (_) { }

        // Smart role fallback identical to createAuthResponse:
        // top-level users (no parentId) → 'ADMIN'; invited sub-users → 'VIEWER'
        const resolvedRole = user.role?.name
            ? user.role.name.toUpperCase()
            : (user.parentId ? 'VIEWER' : 'ADMIN');

        res.json({
            userId: user.id,
            permissions,
            role: resolvedRole,
            isActive: user.isActive,
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
