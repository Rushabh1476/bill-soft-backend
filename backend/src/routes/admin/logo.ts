import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../../lib/prisma';
import { authenticateToken } from '../../middleware/auth';

const router = express.Router();

// Configure storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and WEBP are allowed.') as any, false);
        }
    }
});

// POST /api/admin/logo/upload
router.post('/upload', authenticateToken, upload.single('logo'), async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { position } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const logoUrl = `/uploads/${req.file.filename}`;

        // Update user profile in database using raw SQL to bypass Prisma Client generation issues
        await prisma.$queryRawUnsafe(
            'UPDATE users SET logo_url = ?, logo_position = ? WHERE id = ?',
            logoUrl,
            position || 'left',
            userId
        );

        res.json({
            success: true,
            logoUrl,
            logoPosition: position || 'left'
        });
    } catch (error: any) {
        console.error('[Logo Upload Error]:', error);
        res.status(500).json({ error: error.message || 'Failed to upload logo' });
    }
});

// PATCH /api/admin/logo/settings
router.patch('/settings', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        const { position, width, offsetX, offsetY } = req.body;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Using raw SQL to bypass Prisma Client generation issues (currently locked by running process)
        const sql = `
            UPDATE users 
            SET logo_position = ?, 
                logo_width = ?, 
                logo_offset_x = ?, 
                logo_offset_y = ? 
            WHERE id = ?
        `;

        await prisma.$queryRawUnsafe(
            sql,
            position || 'left',
            Math.round(Number(width)) || 100,
            Math.round(Number(offsetX)) || 0,
            Math.round(Number(offsetY)) || 0,
            userId
        ).catch((e: any) => {
            console.error('[Logo Settings Query Error]:', e);
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error('[Logo Settings Update Error]:', error);
        res.status(500).json({ error: error.message || 'Failed to update logo settings' });
    }
});

export default router;
