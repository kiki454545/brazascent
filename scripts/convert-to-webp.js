const sharp = require('../node_modules/sharp')
const fs = require('fs')
const path = require('path')

const imagesDir = path.join(__dirname, '../public/images')

async function convertAll() {
  const files = fs.readdirSync(imagesDir).filter(f => /\.(jpe?g|png)$/i.test(f))

  if (files.length === 0) {
    console.log('Aucune image jpg/png trouvée dans public/images/')
    return
  }

  let totalBefore = 0
  let totalAfter = 0

  for (const file of files) {
    const input  = path.join(imagesDir, file)
    const output = path.join(imagesDir, file.replace(/\.(jpe?g|png)$/i, '.webp'))

    if (fs.existsSync(output)) {
      const inputMtime  = fs.statSync(input).mtimeMs
      const outputMtime = fs.statSync(output).mtimeMs
      if (outputMtime >= inputMtime) {
        console.log(`SKIP  ${file} (webp déjà à jour)`)
        continue
      }
    }

    await sharp(input).webp({ quality: 80 }).toFile(output)

    const before = fs.statSync(input).size
    const after  = fs.statSync(output).size
    const gain   = Math.round((1 - after / before) * 100)
    totalBefore += before
    totalAfter  += after

    console.log(
      `OK  ${file.padEnd(25)} ${(before / 1024).toFixed(0).padStart(5)} Ko`
      + `  →  ${path.basename(output).padEnd(27)} ${(after / 1024).toFixed(0).padStart(4)} Ko`
      + `  (-${gain}%)`
    )
  }

  if (totalBefore > 0) {
    const totalGain = Math.round((1 - totalAfter / totalBefore) * 100)
    console.log(
      `\nTotal  ${(totalBefore / 1024).toFixed(0)} Ko  →  ${(totalAfter / 1024).toFixed(0)} Ko  (-${totalGain}%)`
    )
  }
}

convertAll().catch(err => {
  console.error(err)
  process.exit(1)
})
