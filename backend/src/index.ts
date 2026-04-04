// BillSoft API Server - Simplified JWT Secret for Reset Flow
import express from 'express'
import path from 'path'
import fs from 'fs'
import prisma from './lib/prisma'

// BigInt JSON support (global) – must be before any JSON.stringify occurs
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};
import { getNetworkIp } from './lib/network'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import customerRoutes from './routes/customers'
import productRoutes from './routes/products'
import billRoutes from './routes/bills'
import adminRoutes from './routes/admin'
import supplierRoutes from './routes/suppliers'
import expenseRoutes from './routes/expenses'
import inventoryRoutes from './routes/inventory'
import serviceRoutes from './routes/services'
import reportsRoutes from './routes/reports'
import superAdminRoutes from './routes/superAdmin'
import publicRoutes from './routes/public'
import templateRoutes from './routes/templates';
import customColumnRoutes from './routes/customColumns'


import serviceTicketRoutes from './routes/serviceTickets'
import purchaseOrderRoutes from './routes/purchaseOrders'


// Import worker — wrapped so Redis being unavailable doesn't crash the server
try {
  require('./workers/importWorker');
  console.log('[Server] BullMQ import worker loaded.');
} catch (err: any) {
  console.warn('[Server] BullMQ worker failed to load (Redis unavailable?). File imports will run in-process.', err.message);
}

// Load environment variables
dotenv.config()
dotenv.config({ path: '.env.local', override: true })

// Auto-detect local IP for development/invite links
// if (!process.env.FRONTEND_URL || process.env.NODE_ENV === 'development') {
//   const localIp = getNetworkIp();
//   process.env.FRONTEND_URL = `http://${localIp}:3000`;
// }

const app = express()
const PORT: number = Number(process.env.SERVER_PORT) || 5000

// Enable CORS for all environments
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5001',
  'http://192.168.31.132:3000',
  'https://billsoft-web.netlify.app',
  'https://billsoft.salonadmin.cloud',
  'https://api.billsoft.salonadmin.cloud',
  'http://billsoft.agbtechnologies.com',
  'https://billsoft.agbtechnologies.com',
  'http://api.billsoft.agbtechnologies.com',
  'https://api.billsoft.agbtechnologies.com',
  'https://billsoft.agbitsolutions.com',
  'http://billsoft.agbitsolutions.com',
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow all origins in development mode (or if localhost/LAN)
    if (!origin || 
        origin.startsWith('http://localhost:') || 
        origin.startsWith('http://127.0.0.1:') ||
        /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(origin)) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS] Rejected origin: ${origin}`);
    return callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['*'] // Use wildcard for headers to avoid preflight issues
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static uploads folder — resolve relative to this source file, not cwd
// tsx runs src/index.ts directly: __dirname = /app/src → ../uploads = /app/uploads (Docker volume)
const uploadsPath = path.join(__dirname, '../uploads');
console.log(`[Static] Serving /uploads from: ${uploadsPath}`);
app.use('/uploads', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=2592000');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
  next();
}, express.static(uploadsPath));

// Also serve on /api/uploads for easier Nginx proxying
app.use('/api/uploads', (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=2592000');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
  next();
}, express.static(uploadsPath));

// Request Logging
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    console.log(`[CORS Preflight] ${req.method} ${req.url} from ${req.headers.origin}`);
  } else {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'N/A'}`);
  }
  next();
});

// Diagnostic: List uploaded files
app.get('/api/system/list-uploads', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsPath);
    res.json({
      success: true,
      uploadsPath,
      count: files.length,
      files: files.slice(0, 50) // Return first 50 files
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, path: uploadsPath });
  }
});

// Redundant surgical strike routes removed. Using modular routes in src/routes/admin/settings.ts instead.


// --- Branding / Admin-Settings Alias for immediate UI sync ---
app.put('/api/admin-settings', async (req, res) => {
  try {
    const { primaryColor } = req.body;
    
    const updated = await prisma.settings.upsert({
      where: { id: 'default_settings_id' },
      update: { primaryColor, updatedAt: new Date() },
      create: { 
        id: 'default_settings_id',
        category: 'general',
        key: 'primary_color',
        displayName: 'Primary Theme Color',
        value: primaryColor || '#3b82f6',
        primaryColor 
      }
    });
    
    res.status(200).json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- DIAGNOSTIC: TEST CONNECTION ---
app.get('/api/system/test-connection', (req, res) => {
  res.json({
    success: true,
    message: "Connection Successful!",
    serverTime: new Date().toISOString(),
    clientIp: req.ip,
    localIp: getNetworkIp()
  });
});

// --- FORCEFUL PUBLIC ROUTE (PLACED BEFORE PROTECTED MODULES) ---
app.get('/api/public-share/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Dynamic import to avoid circular dependency if lib/prisma imports index
    const prisma = require('./lib/prisma').default;

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { companyName: true, email: true, phone: true } },
        customer: { select: { id: true, name: true, email: true, phone: true, address: true } }
      }
    });

    if (!bill) return res.status(404).json({ error: 'Invoice not found' });

    // 2. Fetch Settings (Correct Settings + State Pattern)
    const setting_entry = await prisma.settings.findUnique({
      where: { category_key: { category: 'invoice_settings', key: 'general_preferences' } },
      include: { settingStates: { where: { userId: bill.userId } } }
    });
    
    const settingsValue = setting_entry?.settingStates[0]?.value || setting_entry?.value;
    const preferences = settingsValue ? JSON.parse(settingsValue) : null;

    const parsedItems = bill.items.map((item: any) => ({
      ...item,
      customFields: (() => {
        try {
          return item.customFields ? JSON.parse(item.customFields) : null;
        } catch (e) {
          return null;
        }
      })()
    }));

    res.status(200).json({ 
      bill: { ...bill, items: parsedItems },
      preferences
    });
  } catch (error) {
    console.error('CRITICAL: Public share fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health checks
const healthHandler = (req: express.Request, res: express.Response) => {
  res.json({ status: 'OK', message: 'BillSoft API Server is running' })
};
app.get('/health', healthHandler)
app.get('/api/health', healthHandler)

app.get('/api/system/network-ip', (req, res) => {
  const localIp = getNetworkIp();
  res.json({ ip: localIp });
});

// --- DIAGNOSTIC: TEST EMAIL SERVICE ---
app.post('/api/system/test-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Recipient email is required' });

  try {
    const { sendMail } = require('./services/emailService/mailService');
    console.log(`[Diagnostic] 📧 Testing SMTP delivery to: ${email}`);

    const result = await sendMail({
      to: email,
      subject: 'BillSoft SMTP Diagnostic Test',
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 2px solid #6366f1; border-radius: 12px;">
          <h2 style="color: #6366f1;">System Diagnostic: SMTP Connection</h2>
          <p>This is a test email from the BillSoft API to verify your Gmail App Password configuration.</p>
          <div style="background: #f8fafc; padding: 10px; border-radius: 6px; margin: 10px 0;">
            <strong>Status:</strong> Connection Established ✅<br>
            <strong>Time:</strong> ${new Date().toLocaleString()}
          </div>
          <p>If you received this, your email service is working perfectly!</p>
        </div>
      `
    });

    if (result.success) {
      res.json({ success: true, message: `Diagnostic email successfully dispatched to ${email}. Check your inbox/spam.` });
    } else {
      res.status(500).json({ error: `SMTP Delivery Failed: ${result.error}` });
    }
  } catch (err: any) {
    console.error('Diagnostic Email Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// API Routes
import uploadRoutes from './routes/upload';

const modules = [
  { path: 'auth', routes: authRoutes },
  { path: 'customers', routes: customerRoutes },
  { path: 'products', routes: productRoutes },
  { path: 'bills', routes: billRoutes },
  { path: 'admin', routes: adminRoutes },
  { path: 'suppliers', routes: supplierRoutes },
  { path: 'expenses', routes: expenseRoutes },
  { path: 'inventory', routes: inventoryRoutes },
  { path: 'services', routes: serviceRoutes },
  { path: 'service-tickets', routes: serviceTicketRoutes },
  { path: 'purchase-orders', routes: purchaseOrderRoutes },
  { path: 'reports', routes: reportsRoutes },
  { path: 'upload', routes: uploadRoutes },
  { path: 'super-admin', routes: superAdminRoutes },
  { path: 'templates', routes: templateRoutes },
  { path: 'custom-columns', routes: customColumnRoutes },

  { path: 'web', routes: publicRoutes }
];

modules.forEach(m => {
  app.use(`/api/${m.path}`, m.routes);
});

// Root Info
app.get('/', (req, res) => res.json({ message: 'BillSoft API running on 0.0.0.0' }));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// Listen on 0.0.0.0 to allow mobile device access
app.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('🚀 BillSoft API Server forced to 0.0.0.0')
  console.log(`📡 PORT: ${PORT}`)
  console.log(`🌐 TEST THIS ON MOBILE BROWSER: http://${getNetworkIp()}:${PORT}/api/system/test-connection`)
  console.log(`🔗 FRONTEND URL: ${process.env.FRONTEND_URL || 'Not Set'}`)
  console.log('')
})
