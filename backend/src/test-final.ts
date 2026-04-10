import prisma from './lib/prisma'
import fs from 'fs'

async function test() {
  try {
    const userId = 'clf_dummy_user' // Use anything
    console.log('Querying with user_id & is_active (Snake Case)...')
    const columns = await (prisma as any).custom_columns.findMany({
      where: { user_id: userId, is_active: true }
    })
    fs.writeFileSync('prisma-columns-results.txt', JSON.stringify(columns, null, 2))
    console.log('Success - check results')
  } catch (err: any) {
    fs.writeFileSync('prisma-columns-results.txt', 'Final Try Error: ' + err.message)
    console.error('Final Try Failed')
  } finally {
    process.exit(0)
  }
}
test()
