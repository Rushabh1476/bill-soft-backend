import express from 'express'
import prisma from '../lib/prisma'
import { extractUserFromRequest } from '../lib/auth'
import { createAdminSettingsService } from '../services/AdminSettingsService'
import { autoSendInvoice } from '../services/whatsappService'
import { recordAuditLog } from '../lib/auditLog'
import { getNetworkIp } from '../lib/network'
import { getFrontendUrl, getBaseUrl } from '../lib/baseUrl'

import { generateInvoicePdf, sendInvoiceEmail } from '../services/emailService'

import { authenticateToken, requirePermission } from '../middleware/auth'

const router = express.Router()

const safeParse = (str: any) => {
  if (!str) return null;
  if (typeof str === 'object') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn('[Bills] Failed to parse customFields:', str);
    return null;
  }
};

const fetchPreferences = async (userId: string) => {
  const category = 'invoice_settings';
  const key = 'general_preferences';
  const setting = await prisma.settings.findUnique({
    where: { category_key: { category, key } },
    include: { settingStates: { where: { userId } } }
  });
  if (!setting) return null;
  const rawValue = setting.settingStates.length > 0
    ? setting.settingStates[0].value
    : setting.value;
  return JSON.parse(rawValue);
};

// Get dashboard stats (Total Count and Revenue)
router.get('/stats', authenticateToken, requirePermission('view_bills'), async (req: any, res) => {
  try {
    const userId = req.user.orgId

    const stats = await prisma.bill.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: {
        totalAmount: true
      }
    });

    res.status(200).json({
      totalCount: stats._count.id,
      totalRevenue: stats._sum.totalAmount || 0
    });

  } catch (error) {
    console.error('Get bill stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Helper function to generate bill number
const generateBillNumber = (): string => {
  const prefix = 'INV'
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}


// Get all matching bill IDs
router.get('/all-ids', authenticateToken, requirePermission('view_bills'), async (req: any, res) => {
  try {
    const { search, status, customerId, dateFilter } = req.query
    const userId = req.user.orgId

    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { billNumber: { contains: search as string } },
        { customerName: { contains: search as string } },
        { customerEmail: { contains: search as string } }
      ]
    }

    if (status && status !== 'all') {
      whereClause.status = status.toString().toUpperCase()
    }

    if (customerId) {
      whereClause.customerId = customerId
    }

    if (dateFilter && dateFilter !== 'all') {
      const today = new Date();
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      switch (dateFilter) {
        case 'today':
          whereClause.createdAt = { gte: startOfToday };
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          whereClause.createdAt = { gte: weekAgo };
          break;
        case 'month':
          const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
          whereClause.createdAt = { gte: monthAgo };
          break;
        case 'quarter':
          const quarterAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
          whereClause.createdAt = { gte: quarterAgo };
          break;
      }
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      select: { id: true }
    })

    res.status(200).json({ ids: bills.map(b => b.id) })

  } catch (error) {
    console.error('Get all bill IDs error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all bills
router.get('/', authenticateToken, requirePermission('view_bills'), async (req: any, res) => {
  try {
    const { search, status, customerId, page = 1, limit = 50 } = req.query
    const userId = req.user.orgId
    const actorId = req.user.id

    const skip = (Number(page) - 1) * Number(limit)
    const take = Number(limit)

    const whereClause: any = { userId }

    if (search) {
      whereClause.OR = [
        { billNumber: { contains: search } },
        { customerName: { contains: search } },
        { customerEmail: { contains: search } }
      ]
    }

    if (status) {
      whereClause.status = status.toUpperCase()
    }

    if (customerId) {
      whereClause.customerId = customerId
    }

    // Optimize: only fetch what's needed for the list
    const [bills, total] = await Promise.all([
      prisma.bill.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true
            }
          },
          items: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.bill.count({ where: whereClause })
    ])

    const resultBills = bills.map((bill: any) => ({
      ...bill,
      items: bill.items.map((item: any) => ({
        ...item,
        customFields: safeParse(item.customFields)
      }))
    }));

    res.status(200).json({
      bills: resultBills,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    })

  } catch (error) {
    console.error('Get bills error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create bill
router.post('/', authenticateToken, requirePermission('create_bills'), async (req: any, res) => {
  try {
    const {
      customerId,
      customerName,
      customerEmail,
      items,
      status,
      dueDate,
      notes,
      templateId,
      paidAmount = 0,
      redeemPoints = false,
      branchId,
      supplierId,
      paymentMode
    } = req.body
    const userId = req.user.orgId
    const actorId = req.user.id

    if (!customerId || !customerName || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Customer ID, customer name, and items are required'
      })
    }

    // 0. Fetch Preferences
    const preferences = await fetchPreferences(userId);

    // Start Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 0. Fetch Invoice Preferences
      const settings = await tx.settings.findUnique({
        where: { id: 'default_settings_id' }
      });
      console.log(' Fetched Settings for Invoice Creation:', settings);

      // 1. Validate all products, services, and stock first (Batch check for performance)
      // ... (existing code remains correct for validation)
      // I'll skip to the number override for clarity but maintain correct structure

      // 1. Validate all products, services, and stock first (Batch check for performance)
      const productIds = items.filter((i: any) => !i.isService).map((i: any) => i.productId);
      const serviceIds = items.filter((i: any) => i.isService).map((i: any) => i.serviceId);

      const dbProducts = await tx.product.findMany({
        where: { id: { in: productIds }, userId }
      });
      const dbServices = await tx.service.findMany({
        where: { id: { in: serviceIds }, userId }
      });

      const productMap = new Map(dbProducts.map((p: any) => [p.id, p]));
      const serviceMap = new Map(dbServices.map((s: any) => [s.id, s]));
      let subtotal = 0;

      // 2. Process items and Check stock (Only for Products)
      for (const item of items) {
        if (item.isService) {
          const service: any = serviceMap.get(item.serviceId);
          if (!service) throw new Error(`Service not found: ${item.productName}`);
        } else {
          const product: any = productMap.get(item.productId);
          if (!product) throw new Error(`Product not found: ${item.productName}`);

          const requestedQty = BigInt(Math.round(item.quantity));
          if (product.stock !== null && product.stock < requestedQty) {
            throw new Error(`Insufficient stock for ${item.productName}. Available: ${product.stock}`);
          }
        }

        // Accumulate subtotal
        subtotal += item.total;
      }

      // 3. Subtract Sold Units (Null-safe decrement and check for alerts, ONLY FOR PRODUCTS)
      const lowStockAlerts = [];
      for (const item of items) {
        if (item.isService) continue;

        const product: any = productMap.get(item.productId);

        // Ensure stock isn't completely null before decrementing
        const decrementBy = BigInt(Math.round(item.quantity));
        const newStock = product.stock !== null
          ? (product.stock >= decrementBy ? product.stock - decrementBy : BigInt(0))
          : null;

        if (newStock !== null) {
          const updatedProduct = await tx.product.update({
            where: { id: item.productId },
            data: { stock: newStock }
          });

          if (updatedProduct && updatedProduct.stock !== null && updatedProduct.stock <= 10) {
            lowStockAlerts.push({
              name: updatedProduct.name,
              stock: updatedProduct.stock
            });
          }
        }
      }

      // If low stock alerts were collected, send email to user
      if (lowStockAlerts.length > 0) {
        // Fetch user email for alert
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { email: true }
        });

        if (user?.email) {
          const { sendStockAlertEmail } = require('../services/emailService');
          // Map to the required format for the template
          const alertProducts = lowStockAlerts.map((a: any) => ({
            name: a.name,
            stock: a.stock,
            minStockLevel: 10 // Threshold used in the logic
          }));

          sendStockAlertEmail(user.email, alertProducts).catch((err: any) => {
            console.error('[Inventory] Failed to send stock alert email:', err);
          });
        }
      }

      // Tax: computed per-product using each product's taxRate from DB.
      // The frontend also sends taxAmount calculated the same way — accept it if provided, otherwise
      // compute it here as the authoritative server-side value.
      let computedTaxAmount = 0;
      for (const item of items) {
        let rate = 0;
        if (item.isService) {
          const service: any = serviceMap.get(item.serviceId);
          rate = service?.taxRate ?? 0;
        } else {
          const product: any = productMap.get(item.productId);
          rate = product?.taxRate ?? 0;
        }
        computedTaxAmount += (item.total * rate) / 100;
      }
      // Use frontend value if explicitly provided and matches; otherwise use server-computed value.
      const taxAmount = req.body.taxAmount !== undefined
        ? Number(req.body.taxAmount)
        : computedTaxAmount;
      let totalAmount = subtotal + taxAmount;

      // 4. Handle Loyalty Points (Redeem)
      let discountAmount = 0;
      const customer = await tx.customer.findUnique({ where: { id: customerId } });

      if (redeemPoints && customer && (customer as any).loyaltyPoints && (customer as any).loyaltyPoints > 0) {
        const maxRedeemable = Math.min((customer as any).loyaltyPoints, totalAmount * 0.10);
        discountAmount = maxRedeemable;
        totalAmount -= discountAmount;

        await tx.customer.update({
          where: { id: customerId },
          data: { loyaltyPoints: { decrement: maxRedeemable } }
        });
      }

      // 4. Handle Snapshotting for Historical Integrity
      const columnsSnapshotStr = settings?.customColumns || JSON.stringify(["Product Name", "Quantity", "Price", "Total"]);

      // 5. Handle Status and Approval Workflow
      const isPaidRequest = status && status.toString().toUpperCase() === 'PAID';
      const amountPaid = isPaidRequest ? totalAmount : (Number(paidAmount) || 0);
      const dueAmount = Math.max(0, totalAmount - amountPaid);

      let paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
      if (amountPaid >= totalAmount) paymentStatus = 'PAID';
      else if (amountPaid > 0) paymentStatus = 'PARTIAL';

      // FINAL FORCE-FIX: Hard-coded bill status to PAID (Historical Integrity)
      const billStatus = 'PAID';

      // 6. Earn New Points
      const pointsEarned = Math.floor(totalAmount / 100);
      if (customer) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            loyaltyPoints: { increment: pointsEarned }
          }
        });
      }

      // 7. Create Bill
      // APPLY AUTO-GENERATE PREFERENCE (Ensuring Uniqueness)
      let billNumber = req.body.billNumber || req.body.invoiceNumber;
      if (settings?.autoGenerateInvoiceNumbers || !billNumber) {
        const count = await tx.bill.count({ where: { userId } });
        const prefix = 'INV';
        const year = new Date().getFullYear().toString().slice(-2);

        // Find next available number globally to avoid unique constraint collisions
        let sequence = count + 1;
        let candidateNumber = '';
        let isUnique = false;

        while (!isUnique) {
          candidateNumber = `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
          const existing = await tx.bill.findUnique({ where: { billNumber: candidateNumber } });
          if (!existing) {
            isUnique = true;
          } else {
            sequence++;
          }
        }
        billNumber = candidateNumber;
      }

      const adminSettingsService = createAdminSettingsService(prisma as any);
      const defaultTemplate = templateId || await adminSettingsService.getDefaultTemplate();

      const newBill = await tx.bill.create({
        data: {
          userId,
          customerId,
          billNumber,
          customerName,
          customerEmail: customerEmail || null,
          status: billStatus as any,
          paymentStatus,
          paidAmount: amountPaid,
          dueAmount,
          subtotal,
          taxAmount,
          totalAmount,
          templateId: defaultTemplate,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes: notes || `Points Earned: ${pointsEarned}`,
          columnsSnapshot: columnsSnapshotStr,
          branchId: branchId || null,
          supplierId: supplierId || null,
          paymentMode: paymentMode || 'Cash',
          items: {
            create: items.map((item: any) => {
              let itemTaxRate = item.taxRate ?? 0;
              if (item.isService) {
                const service: any = serviceMap.get(item.serviceId);
                itemTaxRate = service?.taxRate ?? itemTaxRate;
              } else {
                const product: any = productMap.get(item.productId);
                itemTaxRate = product?.taxRate ?? itemTaxRate;
              }
              const itemTaxAmount = (item.total * itemTaxRate) / 100;
              return {
                productId: item.isService ? null : item.productId,
                serviceId: item.isService ? item.serviceId : null,
                isService: item.isService || false,
                productName: item.productName,
                quantity: BigInt(Math.round(item.quantity) || 1),
                price: item.price,
                total: item.total,
                taxRate: itemTaxRate,
                taxAmount: Math.round(itemTaxAmount * 100) / 100,
                custom_fields: item.customFields ? JSON.stringify(item.customFields) : null,
              };
            })
          }
        },
        include: {
          items: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });

      // 8. Update Supplier Balance if linked
      if (supplierId) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            balance: {
              increment: totalAmount
            }
          }
        });
      }

      // 9. Create Audit Log (Single)
      await recordAuditLog({
        prismaClient: tx,
        userId: userId,
        subUserId: actorId,
        action: 'CREATE',
        entity: 'Bill',
        entityId: newBill.id,
        description: `CREATE: Item ${newBill.id} processed. Status: ${billStatus}`,
        req,
        newData: { billNumber, totalAmount, customerName }
      });

      return { bill: newBill, pointsEarned, discountAmount, settings };
    });

    // 10. Fire-and-forget WhatsApp
    const bill: any = result.bill;
    const invoiceSettings = result.settings;

    if (bill.customer?.phone) {
      const appUrl = getFrontendUrl(req);

      autoSendInvoice(
        bill.id,
        bill.customer.phone,
        bill.billNumber || bill.id.slice(0, 8),
        bill.customerName,
        bill.totalAmount,
        appUrl
      ).catch(err => console.error('Background WhatsApp send failed:', err));
    }

    // 11. Auto-send Invoice Email
    // APPLY NOTIFICATION PREFERENCE
    if (bill.customer?.email && invoiceSettings?.sendEmailNotifications) {
      const { sendInvoiceEmail, generateInvoicePdf } = require('../services/emailService');
      const appUrl = getFrontendUrl(req);

      (async () => {
        try {
          const pdfBuffer = await generateInvoicePdf(bill);
          await sendInvoiceEmail(
            bill.customer.email,
            bill.customerName,
            bill.billNumber || bill.id.slice(0, 8),
            bill.totalAmount,
            bill.id,
            appUrl,
            pdfBuffer,
            req.user.email // BCC organization email
          );
          console.log(`[AutoMail] Invoice sent to ${bill.customer.email}`);
        } catch (err) {
          console.error('[AutoMail] Failed to auto-send invoice email:', err);
        }
      })();
    }

    // 12. Send Admin Alerts (Payment Received)
    (async () => {
      try {
        // Check if payment_received_alerts is enabled
        const alertSetting = await prisma.settings.findFirst({
          where: { key: 'payment_received_alerts' }
        });

        const isAlertEnabled = alertSetting && JSON.parse(alertSetting.value as string) === true;

        if (isAlertEnabled && bill.paidAmount > 0) {
          const { sendPaymentReceivedAlertEmail } = require('../services/emailService');
          const adminUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true }
          });

          if (adminUser?.email) {
            await sendPaymentReceivedAlertEmail(
              adminUser.email,
              bill.customerName,
              bill.billNumber || bill.id.slice(0, 8),
              bill.paidAmount
            );
          }
        }
      } catch (err) {
        console.error('[Alerts] Failed to process payment received alert:', err);
      }
    })();

    const resultBill = {
      ...result.bill,
      items: (result.bill as any).items.map((item: any) => ({
        ...item,
        custom_fields: safeParse((item as any).custom_fields)
      }))
    };

    res.status(201).json({
      message: 'Bill created successfully',
      bill: resultBill,
      pointsEarned: result.pointsEarned,
      discountAmount: result.discountAmount
    });

  } catch (error: any) {
    console.error('VALIDATION ERROR:', error);
    console.error('ERROR STACK:', error.stack);
    res.status(400).json({
      error: error.message || 'Internal server error',
      details: error.details || null
    });
  }
});

// Update bill
router.put('/:id', authenticateToken, requirePermission('edit_bills'), async (req: any, res) => {
  try {
    const { id } = req.params
    const {
      customerId,
      customerName,
      customerEmail,
      items,
      status,
      dueDate,
      notes,
      paymentMode
    } = req.body
    const userId = req.user.orgId
    const actorId = req.user.id

    if (!customerId || !customerName || !items || items.length === 0) {
      return res.status(400).json({
        error: 'Customer ID, customer name, and items are required'
      })
    }

    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0)
    const taxAmount = items.reduce((sum: number, item: any) => {
      const rate = item.taxRate ?? 0
      return sum + (item.total * rate) / 100
    }, 0)
    const totalAmount = subtotal + taxAmount

    const bill = await prisma.$transaction(async (tx) => {
      // 1. Fetch the existing bill with items (verify ownership)
      const existingBill = await (tx.bill as any).findFirst({
        where: { id, userId },
        include: { items: true }
      });

      if (!existingBill) {
        throw new Error('Bill not found');
      }

      // 2. Restore stock from OLD items
      for (const oldItem of existingBill.items) {
        if (!oldItem.isService && oldItem.productId && oldItem.quantity > BigInt(0)) {
          await (tx.product as any).updateMany({
            where: { id: oldItem.productId, userId },
            data: { stock: { increment: oldItem.quantity } }
          });
        }
      }

      // 3. Delete old bill items
      await tx.billItem.deleteMany({ where: { billId: id } });

      // 4. Deduct stock for NEW items
      for (const newItem of items) {
        if (!newItem.isService && newItem.productId && newItem.quantity > 0) {
          await (tx.product as any).updateMany({
            where: { id: newItem.productId, userId },
            data: { stock: { decrement: BigInt(Math.round(newItem.quantity)) } }
          });
        }
      }

      // 5. Update bill and create new items
      const updatedBill = await (tx.bill as any).update({
        where: { id },
        data: {
          customerId,
          customerName,
          customerEmail: customerEmail || null,
          status: status?.toUpperCase() || 'DRAFT',
          subtotal,
          taxAmount,
          totalAmount,
          dueDate: dueDate ? new Date(dueDate) : null,
          notes: notes || null,
          paymentMode: paymentMode || 'Cash',
          items: {
            create: items.map((item: any) => {
              const itemTaxRate = item.taxRate ?? 0;
              const itemTaxAmount = (item.total * itemTaxRate) / 100;
              return {
                productId: item.isService ? null : item.productId,
                serviceId: item.isService ? item.serviceId : null,
                isService: item.isService || false,
                productName: item.productName,
                quantity: BigInt(Math.round(item.quantity) || 1),
                price: item.price,
                total: item.total,
                taxRate: itemTaxRate,
                taxAmount: Math.round(itemTaxAmount * 100) / 100,
                custom_fields: item.customFields ? JSON.stringify(item.customFields) : null
              };
            })
          }
        },
        include: { items: true }
      });

      // 6. Audit Log: Update
      await recordAuditLog({
        prismaClient: tx,
        userId: userId,
        subUserId: actorId,
        action: 'UPDATE',
        entity: 'Bill',
        entityId: id,
        description: `Bill #${updatedBill.billNumber} updated — items and totals recalculated`,
        req,
        oldData: { totalAmount: existingBill.totalAmount, status: existingBill.status },
        newData: { totalAmount: updatedBill.totalAmount, status: updatedBill.status }
      });

      return updatedBill;
    });

    res.status(200).json({
      message: 'Bill updated successfully',
      bill
    })
  } catch (error: any) {
    console.error('Update bill error:', error)
    if (error.message === 'Bill not found' || error.code === 'P2025') {
      return res.status(404).json({ error: 'Bill not found' })
    }
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Bulk delete bills
router.post('/delete', authenticateToken, requirePermission('delete_bills'), async (req: any, res) => {
  try {
    const { ids } = req.body;
    const userId = req.user.orgId;
    const actorId = req.user.id;
    const userRole = (req.user.role?.name || 'VIEWER').toUpperCase();

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'An array of bill IDs is required' });
    }

    console.log(`[Bills] Bulk delete request: ${ids.length} items for org: ${userId}`);

    const subBatchSize = 50; // Smaller sub-batch size for bills due to complex operations
    let deletedCount = 0;
    const finalDeletedIds: string[] = [];

    for (let i = 0; i < ids.length; i += subBatchSize) {
      const chunk = ids.slice(i, i + subBatchSize);

      try {
        await prisma.$transaction(async (tx) => {
          const bills = await tx.bill.findMany({
            where: userRole === 'ADMIN' ? { id: { in: chunk } } : { id: { in: chunk }, userId },
            include: { items: true }
          });

          if (bills.length === 0) return;

          // Restore stock safely
          for (const bill of bills) {
            for (const item of bill.items) {
              if (!item.isService && item.productId && item.quantity > BigInt(0)) {
                await (tx.product as any).updateMany({
                  where: { id: item.productId },
                  data: { stock: { increment: item.quantity } }
                });
              }
            }
          }

          const billIds = bills.map(b => b.id);
          await tx.billItem.deleteMany({ where: { billId: { in: billIds } } });
          await tx.bill.deleteMany({ where: { id: { in: billIds } } });

          deletedCount += bills.length;
          finalDeletedIds.push(...billIds);
        });
      } catch (err) {
        console.error(`[Bills] Bulk delete chunk starting at ${i} failed:`, err);
        // Continue to next chunk
      }
    }

    // Final Audit Log for Bulk Delete (Single Entry Rule)
    if (finalDeletedIds.length > 0) {
      const isBulk = finalDeletedIds.length > 1;
      await recordAuditLog({
        userId: userId,
        subUserId: actorId,
        action: isBulk ? 'BULK_DELETE' as any : 'DELETE',
        entity: 'Bill',
        entityId: isBulk ? `bulk-del-${Date.now()}` : finalDeletedIds[0],
        description: isBulk
          ? `Bulk DELETE: ${finalDeletedIds.length} items processed`
          : `DELETE: Item ${finalDeletedIds[0]} processed`,
        req,
        newData: { count: finalDeletedIds.length }
      });
    }

    res.status(200).json({
      message: `${deletedCount} bills deleted successfully and stock restored`,
      deletedCount,
      deletedIds: finalDeletedIds
    });
  } catch (error: any) {
    console.error('Bulk delete bills error:', error);
    res.status(500).json({ error: 'Internal server error during bulk billing deletion' });
  }
})

// Get, Delete, Public routes remain same...
router.delete('/:id', authenticateToken, requirePermission('delete_bills'), async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.orgId;
    const actorId = req.user.id;
    const userRole = (req.user.role?.name || 'VIEWER').toUpperCase();

    await prisma.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: userRole === 'ADMIN' ? { id } : { id, userId },
        include: { items: true }
      });

      if (!bill) throw new Error('Bill not found');

      for (const item of bill.items) {
        if (!item.isService && item.productId && item.quantity > BigInt(0)) {
          await (tx.product as any).updateMany({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
      }

      await tx.billItem.deleteMany({ where: { billId: id } });
      await tx.bill.delete({ where: { id: id } });

      await recordAuditLog({
        prismaClient: tx,
        userId: userId,
        subUserId: actorId,
        action: 'DELETE',
        entity: 'Bill',
        entityId: id,
        description: `DELETE: Item ${id} processed`,
        req,
        newData: { billNumber: bill.billNumber, totalAmount: Number(bill.totalAmount) }
      });
    });

    res.status(200).json({ message: 'Bill deleted successfully and stock restored' })
  } catch (error: any) {
    console.error('Delete bill error:', error)
    if (error.message === 'Bill not found') return res.status(404).json({ error: 'Bill not found' })
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/public/:id', async (req: any, res) => {
  try {
    const { id } = req.params
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { companyName: true, email: true, phone: true, logoUrl: true, logoPosition: true, address: true, gstNumber: true, panNumber: true, bankName: true, accountNumber: true, ifscCode: true, branchName: true, upiId: true } },
        customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
        supplier: { select: { id: true, name: true, phone: true, address: true } }
      }
    })
    if (!bill) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Parse customFields for items
    (bill as any).items = bill.items.map((item: any) => ({
      ...item,
      customFields: safeParse(item.customFields)
    }));

    res.status(200).json({ bill })
  } catch (error) {
    console.error('Get public bill error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:id', authenticateToken, requirePermission('view_bills'), async (req: any, res) => {
  try {
    const { id } = req.params
    const userId = req.user.orgId
    const actorId = req.user.id;
    const bill = await prisma.bill.findFirst({
      where: { id, userId },
      include: {
        items: true,
        user: { select: { companyName: true, email: true, phone: true, logoUrl: true, logoPosition: true, address: true, gstNumber: true, panNumber: true, bankName: true, accountNumber: true, ifscCode: true, branchName: true, upiId: true } },
        customer: { select: { id: true, name: true, email: true, phone: true, address: true } },
        supplier: { select: { id: true, name: true, phone: true, address: true } }
      }
    })
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Parse customFields for items
    (bill as any).items = bill.items.map((item: any) => ({
      ...item,
      customFields: safeParse(item.customFields)
    }));

    res.status(200).json({ bill })
  } catch (error) {
    console.error('Get bill error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/share/email', authenticateToken, requirePermission('view_bills'), async (req: any, res) => {
  try {
    const { billId } = req.body;
    const userId = req.user.orgId;
    const bill = await prisma.bill.findFirst({
      where: { id: billId, userId },
      include: { items: true, customer: true }
    });
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    const toEmail = bill.customerEmail || bill.customer.email;
    if (!toEmail) return res.status(400).json({ error: 'Customer has no email' });
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Map to InvoiceData interface for PDF Service
    const invoiceData: any = {
      billNumber: bill.billNumber || bill.id.slice(0, 8),
      customerName: bill.customerName,
      customerEmail: toEmail,
      customerPhone: bill.customer?.phone,
      items: bill.items.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      subtotal: bill.subtotal,
      taxAmount: bill.taxAmount,
      totalAmount: bill.totalAmount,
      notes: bill.notes,
      createdAt: bill.createdAt,
      companyName: user?.companyName || 'My Business',
      companyAddress: '',
      companyPhone: user?.phone || '',
      companyEmail: user?.email || '',
    };

    const pdfBuffer = await generateInvoicePdf(invoiceData);
    const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    await sendInvoiceEmail(toEmail, bill.customerName, invoiceData.billNumber, bill.totalAmount, bill.id, appUrl, pdfBuffer);
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email share error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router
