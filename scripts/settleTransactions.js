const performDatabaseUpdate = require('./performDatabaseUpdate')

const { Payment } = require('../models')

async function run() {
  try {
    // update pending payments to cancelled
    await Payment.updateMany({ status: 'pending' }, { status: 'cancelled' })
    console.log('done')
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
