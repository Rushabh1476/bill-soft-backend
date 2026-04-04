import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class DatabaseHelper {
  async verifyUserExists(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    return !!user;
  }

  async getUserCount(): Promise<number> {
    return await prisma.user.count();
  }

  async getCustomerCount(userId?: string): Promise<number> {
    if (userId) {
      return await prisma.customer.count({
        where: { userId }
      });
    }
    return await prisma.customer.count();
  }

  async getProductCount(userId?: string): Promise<number> {
    if (userId) {
      return await prisma.product.count({
        where: { userId }
      });
    }
    return await prisma.product.count();
  }

  async getBillCount(userId?: string): Promise<number> {
    if (userId) {
      return await prisma.bill.count({
        where: { userId }
      });
    }
    return await prisma.bill.count();
  }

  async getBillItemCount(): Promise<number> {
    return await prisma.billItem.count();
  }

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        customers: true,
        products: true,
        bills: true
      }
    });
  }

  async getCustomersByUser(userId: string) {
    return await prisma.customer.findMany({
      where: { userId }
    });
  }

  async getProductsByUser(userId: string) {
    return await prisma.product.findMany({
      where: { userId }
    });
  }

  async getBillsByUser(userId: string) {
    return await prisma.bill.findMany({
      where: { userId },
      include: {
        items: true,
        customer: true
      }
    });
  }

  async getBillsWithStatus(status: string, userId?: string) {
    const where: any = { status };
    if (userId) {
      where.userId = userId;
    }
    return await prisma.bill.findMany({
      where
    });
  }

  async getRoleCount(): Promise<number> {
    return await prisma.role.count();
  }

  async getSessionCount(userId?: string): Promise<number> {
    if (userId) {
      return await prisma.userSession.count({
        where: { userId }
      });
    }
    return await prisma.userSession.count();
  }

  async getSecurityLogCount(userId?: string): Promise<number> {
    if (userId) {
      return await prisma.securityLog.count({
        where: { userId }
      });
    }
    return await prisma.securityLog.count();
  }

  async getAllTablesStatus() {
    const [
      userCount,
      customerCount,
      productCount,
      billCount,
      billItemCount,
      roleCount,
      sessionCount,
      securityLogCount
    ] = await Promise.all([
      this.getUserCount(),
      this.getCustomerCount(),
      this.getProductCount(),
      this.getBillCount(),
      this.getBillItemCount(),
      this.getRoleCount(),
      this.getSessionCount(),
      this.getSecurityLogCount()
    ]);

    return {
      users: userCount,
      customers: customerCount,
      products: productCount,
      bills: billCount,
      billItems: billItemCount,
      roles: roleCount,
      sessions: sessionCount,
      securityLogs: securityLogCount
    };
  }

  async verifyBillIntegrity(billId: string) {
    const bill = await prisma.bill.findUnique({
      where: { id: billId },
      include: {
        items: true,
        customer: true,
        user: true
      }
    });

    if (!bill) {
      return { valid: false, message: 'Bill not found' };
    }

    // Check if all relations exist
    if (!bill.customer) {
      return { valid: false, message: 'Customer not found' };
    }

    if (!bill.user) {
      return { valid: false, message: 'User not found' };
    }

    if (bill.items.length === 0) {
      return { valid: false, message: 'No bill items' };
    }

    // Verify totals
    const calculatedSubtotal = bill.items.reduce((sum: number, item: any) => sum + item.total, 0);
    const calculatedTaxAmount = bill.items.reduce((sum: number, item: any) => sum + (item.taxAmount || 0), 0);
    const calculatedTotal = calculatedSubtotal + calculatedTaxAmount;

    const subtotalMatch = Math.abs(bill.subtotal - calculatedSubtotal) < 0.01;
    const taxMatch = Math.abs(bill.taxAmount - calculatedTaxAmount) < 0.01;
    const totalMatch = Math.abs(bill.totalAmount - calculatedTotal) < 0.01;

    if (!subtotalMatch || !taxMatch || !totalMatch) {
      return {
        valid: false,
        message: 'Bill totals mismatch',
        details: {
          storedSubtotal: bill.subtotal,
          calculatedSubtotal,
          storedTax: bill.taxAmount,
          calculatedTax: calculatedTaxAmount,
          storedTotal: bill.totalAmount,
          calculatedTotal
        }
      };
    }

    return { valid: true, message: 'Bill integrity verified' };
  }

  async cleanupTestData(emailPattern: string = '@example.com') {
    // Delete test users and cascade will handle related data
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: emailPattern
        }
      }
    });
  }

  async disconnect() {
    await prisma.$disconnect();
  }
}

export const dbHelper = new DatabaseHelper();
