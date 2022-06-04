const fs = require('fs')

const unlinkForReal = file => {
  if (fs.existsSync(file)) fs.unlinkSync(file)
}

const unlinkSync = filepath => {
  try {
    if (typeof filepath === 'string') unlinkForReal(filepath)
    else filepath.forEach(unlinkForReal)
    return filepath
  } catch (err) {
    return { err }
  }
}

module.exports = unlinkSync
