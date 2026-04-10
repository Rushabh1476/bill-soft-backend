import prisma from './lib/prisma'
import fs from 'fs'

async function test() {
  try {
    console.log('Querying all custom_columns...')
    const columns = await (prisma as any).custom_columns.findMany({})
    fs.writeFileSync('prisma-columns-results.txt', JSON.stringify(columns, null, 2))
    console.log('Success, wrote to file')
  } catch (err: any) {
    fs.writeFileSync('prisma-columns-results.txt', 'Error: ' + err.message + '\n' + err.stack)
    console.error('Error detail saved to file')
  } finally {
    process.exit(0)
  }
}
test()
