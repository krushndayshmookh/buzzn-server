/* eslint-disable import/no-dynamic-require */
/* eslint-disable global-require */
const fs = require('fs')
const path = require('path')

const models = {}

const modelFiles = fs.readdirSync(path.join(__dirname, './'))

for (let i = 0; i < modelFiles.length; i++) {
  const modelFile = modelFiles[i]
  const fileName = modelFile.split('.')[0]
  if (fileName !== 'index') {
    const modelData = require(path.join(__dirname, modelFile))
    models[modelData.name] = modelData.model
  }
}

module.exports = models
