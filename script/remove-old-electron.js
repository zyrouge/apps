#!/usr/bin/env node

const fs = require('fs').promises

const findOldElectron = require('../lib/old-electron')

/* Links can break at any time and it's outside of the repo's control,
   so it doesn't make sense to run this script as part of CI. Instead,
   this should be run periodically as part of a separate process. */

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

const numberArgs = process.argv.filter((v) => /^\d+$/.test(v))
const possibleStart =
  numberArgs.length > 0 ? parseInt(numberArgs[0], 10) : undefined
const possibleEnd =
  numberArgs.length > 0 ? parseInt(numberArgs[1], 10) : undefined

console.log(
  `Checking apps ${possibleStart || 0} through ${
    possibleEnd || 'infinity'
  } for old electron apps`
)

function isRateLimited(olds = []) {
  return olds.every(({ version }) => version < "4.0.0")
}

async function main() {
  const oldArrays = (await findOldElectron(possibleStart, possibleEnd)).filter(
    (old) => {
      return !isRateLimited(old.result)
    }
  )

  console.log(`Will disable ${oldArrays.length} entries`)

  for (const old of oldArrays) {
    console.timeLog(old.result)
    let data = await fs.readFile(old.entry.fullPath, { encoding: 'utf-8' })

    if (!data.endsWith('\n')) {
      data += `\n`
    }

    data += `disabled: true # Old Electron version: ${old.result.version}\n`

    await fs.writeFile(old.entry.fullPath, data, { encoding: 'utf-8' })

    console.log(data)
    console.log(`\n---\n`)
  }
}

main()
