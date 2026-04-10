import prisma from './lib/prisma'
import fs from 'fs'

async function check() {
  const p = prisma as any
  const keys = Object.keys(p)
  fs.writeFileSync('prisma-diagnostics.txt', JSON.stringify({
    has_custom_columns: !!p.custom_columns,
    has_CustomColumns: !!p.CustomColumns,
    has_customcolumns: !!p.customcolumns,
    keys: keys.filter(k => k.toLowerCase().includes('column') || k === 'user')
  }, null, 2))
  process.exit(0)
}
check()
