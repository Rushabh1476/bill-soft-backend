import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const preferences: Record<string, any> = {
    auto_generate_invoice_numbers: true,
    include_company_logo: true,
    send_email_notifications: true,
    show_payment_terms: true,
    include_tax_breakdown: true,
    require_approval: true,
    approval_threshold: 5000
  };

  for (const [key, value] of Object.entries(preferences)) {
    const valueType = typeof value === 'boolean' ? 'BOOLEAN' : typeof value === 'number' ? 'NUMBER' : 'STRING';
    
    await prisma.settings.upsert({
      where: {
        category_key: { key, category: 'invoice' }
      },
      update: { value: JSON.stringify(value) },
      create: {
        key,
        category: 'invoice',
        value: JSON.stringify(value),
        valueType: valueType as any,
        displayName: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        isSystemSetting: false,
        isUserEditable: true,
        order: 0
      }
    });
  }
}

main().then(() => console.log('SUCCESS confirmation')).catch(console.error);
