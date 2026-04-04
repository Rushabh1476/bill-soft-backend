import prisma from './lib/prisma'
import fs from 'fs'

async function test() {
  try {
    const keys = Object.keys(prisma)
    fs.writeFileSync('prisma-keys.txt', JSON.stringify(keys, null, 2))
    console.log('Keys written to prisma-keys.txt')
  } catch (err: any) {
    fs.appendFileSync('prisma-keys.txt', '\nError: ' + err.message)
  } finally {
    process.exit(0)
  }
}
test()
