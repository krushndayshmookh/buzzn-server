/* eslint-disable no-unused-vars */
const performDatabaseUpdate = require('./performDatabaseUpdate')
const moment = require('moment-timezone')
const fs = require('fs-extra')

const ObjectId = require('mongoose').Types.ObjectId

const models = require('../models')

async function run() {
  try {
    // do something
    await models.User.updateMany({}, { $set: { chips: 1000 } })
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
