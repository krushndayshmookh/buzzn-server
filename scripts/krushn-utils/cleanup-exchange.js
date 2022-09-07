const performDatabaseUpdate = require('../performDatabaseUpdate')

const {
  BlockDelta,
  Holding,
  Instrument,
  Order,
  Payment,
  Trade,
  User,
} = require('../../models')

async function run() {
  try {
    // cleanup BlockDeltas, Orders, Trades, Payments and Holdings
    await BlockDelta.deleteMany({})
    await Order.deleteMany({})
    await Trade.deleteMany({})
    await Payment.deleteMany({})
    await Holding.deleteMany({})

    // reset Intruments
    await Instrument.updateMany(
      {},
      { ltp: 10, fresh: 0, minted: 0, floating: 0, delta: 0 }
    )

    // reset User.cash
    await User.updateMany({}, { cash: 0 })

    console.info('done')
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
