/**
 * Inventory Monitoring Cron Job
 * Checks product stock levels daily and creates alerts
 */

import prisma from '../lib/prisma';

export interface StockAlert {
    id: string;
    productId: string;
    productName: string;
    currentStock: number;
    minStockLevel: number;
    alertType: 'LOW_STOCK' | 'OUT_OF_STOCK' | 'EXPIRING_SOON';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    createdAt: Date;
}

/**
 * Check for low stock products
 */
async function checkLowStock(): Promise<StockAlert[]> {
    try {
        const lowStockProducts = await prisma.product.findMany({
            where: {
                OR: [
                    {
                        stock: {
                            lte: 10, // Stock less than or equal to 10
                        },
                    },
                    {
                        stock: {
                            equals: 0, // Out of stock
                        },
                    },
                ],
            },
            select: {
                id: true,
                name: true,
                stock: true,
                minStockLevel: true,
            },
        });

        const alerts: StockAlert[] = lowStockProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const currentStock = product.stock || 0;
            const minLevel = product.minStockLevel || 10;

            return {
                id: `alert-${product.id}-${Date.now()}`,
                productId: product.id,
                productName: product.name,
                currentStock,
                minStockLevel: minLevel,
                alertType: isOutOfStock ? 'OUT_OF_STOCK' : 'LOW_STOCK',
                severity: isOutOfStock ? 'HIGH' : currentStock <= 5 ? 'HIGH' : 'MEDIUM',
                message: isOutOfStock
                    ? `${product.name} is out of stock!`
                    : `${product.name} is running low (${currentStock} units remaining)`,
                createdAt: new Date(),
            };
        });

        return alerts;
    } catch (error) {
        console.error('[CRON] Error checking low stock:', error);
        return [];
    }
}

/**
 * Check for expiring products
 */
async function checkExpiringProducts(): Promise<StockAlert[]> {
    try {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        const expiringProducts = await prisma.product.findMany({
            where: {
                expiryDate: {
                    lte: sevenDaysFromNow,
                    gte: new Date(), // Not already expired
                },
            },
            select: {
                id: true,
                name: true,
                stock: true,
                expiryDate: true,
            },
        });

        const alerts: StockAlert[] = expiringProducts.map((product) => {
            const daysUntilExpiry = Math.ceil(
                (new Date(product.expiryDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );

            return {
                id: `alert-${product.id}-expiry-${Date.now()}`,
                productId: product.id,
                productName: product.name,
                currentStock: product.stock || 0,
                minStockLevel: 0,
                alertType: 'EXPIRING_SOON',
                severity: daysUntilExpiry <= 3 ? 'HIGH' : 'MEDIUM',
                message: `${product.name} expires in ${daysUntilExpiry} day(s)`,
                createdAt: new Date(),
            };
        });

        return alerts;
    } catch (error) {
        console.error('[CRON] Error checking expiring products:', error);
        return [];
    }
}

/**
 * Main cron job function - runs daily
 */
export async function runDailyInventoryCheck(): Promise<{
    success: boolean;
    alerts: StockAlert[];
    summary: {
        lowStock: number;
        outOfStock: number;
        expiringSoon: number;
        total: number;
    };
}> {
    console.log('[CRON] Starting daily inventory check...');

    try {
        // Check for low stock and expiring products
        const [lowStockAlerts, expiringAlerts] = await Promise.all([
            checkLowStock(),
            checkExpiringProducts(),
        ]);

        const allAlerts = [...lowStockAlerts, ...expiringAlerts];

        // Count alerts by type
        const summary = {
            lowStock: lowStockAlerts.filter((a) => a.alertType === 'LOW_STOCK').length,
            outOfStock: lowStockAlerts.filter((a) => a.alertType === 'OUT_OF_STOCK').length,
            expiringSoon: expiringAlerts.length,
            total: allAlerts.length,
        };

        console.log('[CRON] Inventory check complete:', summary);

        // TODO: Send notifications (email, push, etc.)
        if (allAlerts.length > 0) {
            console.log(`[CRON] Found ${allAlerts.length} alerts:`, allAlerts);
        }

        return {
            success: true,
            alerts: allAlerts,
            summary,
        };
    } catch (error) {
        console.error('[CRON] Daily inventory check failed:', error);
        return {
            success: false,
            alerts: [],
            summary: {
                lowStock: 0,
                outOfStock: 0,
                expiringSoon: 0,
                total: 0,
            },
        };
    }
}

/**
 * Schedule the cron job
 * Call this in your server initialization
 */
export function scheduleInventoryChecks() {
    // Run immediately on startup
    runDailyInventoryCheck();

    // Schedule to run daily at 9 AM
    const runAt9AM = () => {
        const now = new Date();
        const next9AM = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            9,
            0,
            0,
            0
        );
        const timeUntil9AM = next9AM.getTime() - now.getTime();

        setTimeout(() => {
            runDailyInventoryCheck();
            // Schedule next run (every 24 hours)
            setInterval(runDailyInventoryCheck, 24 * 60 * 60 * 1000);
        }, timeUntil9AM);
    };

    runAt9AM();
    console.log('[CRON] Inventory check scheduled for daily 9 AM');
}
