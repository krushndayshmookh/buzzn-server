const fs = require('fs')
const path = require('path')

const makedirForReal = dir => {
  const dirpath = path.join(__dirname, '..', dir)

  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, {
      recursive: true,
    })
  }
}

const mkdirSync = dirpath => {
  // console.info('Creating directories...')

  try {
    if (typeof dirpath === 'string') makedirForReal(dirpath)
    else dirpath.forEach(makedirForReal)
    return dirpath
  } catch (err) {
    return { err }
  }
}

module.exports = mkdirSync
