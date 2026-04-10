
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function main() {
    const settings = await prisma.settings.findMany();
    fs.writeFileSync('settings_dump.json', JSON.stringify(settings, null, 2));
    console.log('Dumped ' + settings.length + ' settings');
}

main().catch(console.error).finally(() => prisma.$disconnect());
