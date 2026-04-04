import prisma from './lib/prisma'
import fs from 'fs'

async function test() {
  try {
    const userId = 'some_user_id'
    console.log('Querying with where { userId: "some_user_id", isActive: true }')
    const columns = await (prisma as any).custom_columns.findMany({
      where: { userId, isActive: true }
    })
    fs.writeFileSync('prisma-columns-results.txt', JSON.stringify(columns, null, 2))
    console.log('Success')
  } catch (err: any) {
    fs.writeFileSync('prisma-columns-results.txt', 'Error: ' + err.message + '\n' + err.stack)
    console.error('Failure saving details')
  } finally {
    process.exit(0)
  }
}
test()
