import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Generic upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const type = (req.query.type as string) || 'general';
        // __dirname = /app/src/routes → ../../uploads = /app/uploads (Docker volume mount)
        const uploadDir = path.join(__dirname, '../../uploads', type);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true, mode: 0o777 });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
            cb(new Error('Invalid file type') as any, false);
        }
    }
});

// POST /api/upload?type=products|avatars|general
router.post('/', authenticateToken, upload.single('image'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const type = req.query.type || 'general';
        const imageUrl = `/uploads/${type}/${req.file.filename}`;

        res.json({
            success: true,
            imageUrl
        });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
