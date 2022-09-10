const moment = require('moment-timezone')
const performDatabaseUpdate = require('./performDatabaseUpdate')
const { Order, Holding } = require('../models')

async function run() {
  const pendingSellOrders = await Order.find({
    status: 'pending',
    transactionType: 'sell',
  }).populate('trades')

  for (let i = 0; i < pendingSellOrders.length; i++) {
    const order = pendingSellOrders[i]

    const holding = await Holding.findOne({
      instrument: order.instrument,
      user: order.user,
    })

    // console.log(
    //   order.quantity,
    //   order.trades.length,
    //   order.matchedQuantity,
    //   order.unmatchedQuantity
    // )

    holding.quantity += order.unmatchedQuantity
    await holding.save()
  }

  const result = await Order.updateMany(
    { status: 'pending' },
    {
      status: 'cancelled',
    }
  )

  console.info(
    moment.tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss'),
    `Cancelled ${result.modifiedCount} pending orders including ${pendingSellOrders.length} SELL orders`
  )
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
