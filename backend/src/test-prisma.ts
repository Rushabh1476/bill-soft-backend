import prisma from './lib/prisma'

async function test() {
  try {
    console.log('Testing custom_columns query...')
    console.log('Prisma keys:', Object.keys(prisma))
    const columns = await (prisma as any).custom_columns.findMany({
      where: { isActive: true },
      take: 1
    })
    console.log('Success:', columns)
  } catch (err: any) {
    console.error('Error in custom_columns query:', err.message)
    if (err.stack) console.error(err.stack)
  } finally {
    process.exit(0)
  }
}

test()
