const {
  Order,
  Trade,
  Instrument,
  Holding,
  User,
  BlockDelta,
  Config,
  Transaction,
} = require('../models')

const FRESH_SYSTEM_RATE = 0.8
const FRESH_OWNER_RATE = 0

const FLOAT_SYSTEM_RATE = 0.005
const FLOAT_OWNER_RATE = 0.005

module.exports = async order => {
  const newOrder = order
  let qtyMatched = 0
  let amountMatched = 0
  const instrument = await Instrument.findById(newOrder.instrument)
  let holding = await Holding.findOne({
    instrument: instrument._id,
    user: newOrder.user,
  })
  let totalSystemCommission = 0

  if (!holding) {
    holding = new Holding({
      instrument: instrument._id,
      user: newOrder.user,
      quantity: 0,
      averagePrice: 0,
    })
  }

  if (newOrder.type === 'market') {
    if (newOrder.transactionType === 'buy') {
      if (instrument.fresh) {
        // fresh buy

        const newTrade = new Trade({
          buyer: newOrder.user,
          seller: instrument.user,
          instrument: instrument._id,
          price: instrument.ltp,
          quantity: Math.min(newOrder.quantity, instrument.fresh),
          ownerCommission: FRESH_OWNER_RATE,
        })

        newTrade.systemCommission =
          newTrade.quantity * newTrade.price * FRESH_SYSTEM_RATE
        const totalCommission =
          newTrade.systemCommission + newTrade.ownerCommission

        totalSystemCommission += newTrade.systemCommission

        const freshOrder = new Order({
          user: instrument.user,
          instrument: instrument._id,
          quantity: newTrade.quantity,
          price: newTrade.price,
          transactionType: 'fresh-sell',
          status: 'executed',
          type: 'limit',
        })

        freshOrder.trades.push(newTrade._id)
        await freshOrder.save()

        await newTrade.save()
        qtyMatched += newTrade.quantity
        amountMatched += newTrade.quantity * newTrade.price

        newOrder.trades.push(newTrade)
        await newOrder.save()

        const existingPrice = holding.averagePrice
        const existingValue = holding.quantity * existingPrice
        const newValue = newTrade.quantity * newTrade.price
        holding.quantity += newTrade.quantity
        holding.averagePrice = (existingValue + newValue) / holding.quantity
        await holding.save()

        instrument.fresh -= newTrade.quantity
        instrument.floating += newTrade.quantity
        instrument.delta = newTrade.price - instrument.ltp
        instrument.ltp = newTrade.price
        await instrument.save()

        const blockDeltaBuyer = new BlockDelta({
          user: newOrder.user,
          instrument: instrument._id,
          type: 'fresh-buy',
          quantity: newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        const blockDeltaSeller = new BlockDelta({
          user: instrument.user,
          instrument: instrument._id,
          type: 'fresh-sell',
          quantity: -newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        await blockDeltaBuyer.save()
        await blockDeltaSeller.save()

        await User.updateOne(
          { _id: newOrder.user },
          { $inc: { cash: -amountMatched } }
        )
        await User.updateOne(
          { _id: instrument.user },
          { $inc: { cash: amountMatched - totalCommission } }
        )
        await Transaction.insertMany([
          {
            user: newOrder.user,
            amount: -amountMatched,
            type: 'trade-buy',
            trade: newTrade._id,
          },
          {
            user: instrument.user,
            amount: amountMatched - totalCommission,
            type: 'trade-fresh-sell',
            trade: newTrade._id,
          },
        ])
      }

      if (qtyMatched === newOrder.quantity) {
        newOrder.status = 'executed'
        await newOrder.save()
        await Config.updateOne(
          { name: process.env.CONFIG_NAME },
          { $inc: { systemCommission: totalSystemCommission } }
        )
        return
      }

      // float buy
      const matchingOrders = await Order.find({
        status: 'pending',
        transactionType: 'sell',
        instrument: newOrder.instrument,
        user: {
          $ne: newOrder.user,
        },
      })
        .populate('trades')
        .sort({ price: -1, createdAt: 1 })

      for (let i = 0; i < matchingOrders.length; i++) {
        const candidateOrder = matchingOrders[i]

        const qtyPending = newOrder.quantity - qtyMatched

        const candidateMatchedQuantity = candidateOrder.trades.reduce(
          (total, trade) => total + trade.quantity,
          0
        )

        const candidateUnmatchedQuantity =
          candidateOrder.quantity - candidateMatchedQuantity

        const newTrade = new Trade({
          buyer: newOrder.user,
          seller: candidateOrder.user,
          instrument: instrument._id,
          price: candidateOrder.price,
          quantity: Math.min(qtyPending, candidateUnmatchedQuantity),
        })

        newTrade.systemCommission =
          newTrade.quantity * newTrade.price * FLOAT_SYSTEM_RATE
        newTrade.ownerCommission =
          newTrade.quantity * newTrade.price * FLOAT_OWNER_RATE
        const totalTradeCommission =
          newTrade.systemCommission + newTrade.ownerCommission

        totalSystemCommission += newTrade.systemCommission

        await newTrade.save()

        qtyMatched += newTrade.quantity
        amountMatched += newTrade.quantity * newTrade.price

        newOrder.trades.push(newTrade)
        const existingPrice = holding.averagePrice
        const existingValue = holding.quantity * existingPrice
        const newValue = newTrade.quantity * newTrade.price
        holding.quantity += newTrade.quantity
        holding.averagePrice = (existingValue + newValue) / holding.quantity
        await holding.save()

        if (qtyMatched === newOrder.quantity) {
          newOrder.status = 'executed'
        }

        candidateOrder.trades.push(newTrade)
        if (candidateUnmatchedQuantity === newTrade.quantity) {
          candidateOrder.status = 'executed'
        }

        const blockDeltaBuyer = new BlockDelta({
          user: newOrder.user,
          instrument: instrument._id,
          type: 'buy',
          quantity: newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        const blockDeltaSeller = new BlockDelta({
          user: candidateOrder.user,
          instrument: instrument._id,
          type: 'sell',
          quantity: -newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        await blockDeltaBuyer.save()
        await blockDeltaSeller.save()

        await newOrder.save()
        await candidateOrder.save()

        await User.updateOne(
          { _id: newOrder.user },
          { $inc: { cash: -amountMatched } }
        )
        await User.updateOne(
          { _id: candidateOrder.user },
          { $inc: { cash: amountMatched - totalTradeCommission } }
        )
        await User.updateOne(
          { _id: instrument.user },
          { $inc: { cash: newTrade.ownerCommission } }
        )
        await Transaction.insertMany([
          {
            user: newOrder.user,
            amount: -amountMatched,
            type: 'trade-buy',
            trade: newTrade._id,
          },
          {
            user: candidateOrder.user,
            amount: amountMatched - totalTradeCommission,
            type: 'trade-sell',
            trade: newTrade._id,
          },
          {
            user: instrument.user,
            amount: newTrade.ownerCommission,
            type: 'trade-commision',
            trade: newTrade._id,
          },
        ])

        instrument.delta = newTrade.price - instrument.ltp
        instrument.ltp = newTrade.price
        await instrument.save()

        if (newOrder.status === 'executed') {
          await Config.updateOne(
            { name: process.env.CONFIG_NAME },
            { $inc: { systemCommission: totalSystemCommission } }
          )
          return
        }
      }
    }

    if (newOrder.transactionType === 'sell') {
      const matchingOrders = await Order.find({
        status: 'pending',
        transactionType: 'buy',
        instrument: instrument._id,
        user: {
          $ne: newOrder.user,
        },
      })
        .populate('trades')
        .sort({ price: -1, createdAt: 1 })

      for (let i = 0; i < matchingOrders.length; i++) {
        const candidateOrder = matchingOrders[i]

        const qtyPending = newOrder.quantity - qtyMatched

        const candidateMatchedQuantity = candidateOrder.trades.reduce(
          (total, trade) => total + trade.quantity,
          0
        )

        const candidateUnmatchedQuantity =
          candidateOrder.quantity - candidateMatchedQuantity

        const newTrade = new Trade({
          seller: newOrder.user,
          buyer: candidateOrder.user,
          instrument: newOrder.instrument,
          price: candidateOrder.price,
          quantity: Math.min(qtyPending, candidateUnmatchedQuantity),
        })

        newTrade.systemCommission =
          newTrade.quantity * newTrade.price * FLOAT_SYSTEM_RATE
        newTrade.ownerCommission =
          newTrade.quantity * newTrade.price * FLOAT_OWNER_RATE
        const totalTradeCommission =
          newTrade.systemCommission + newTrade.ownerCommission

        totalSystemCommission += newTrade.systemCommission

        await newTrade.save()
        qtyMatched += newTrade.quantity
        amountMatched += newTrade.quantity * newTrade.price

        newOrder.trades.push(newTrade)

        if (qtyMatched === newOrder.quantity) {
          newOrder.status = 'executed'
        }

        candidateOrder.trades.push(newTrade)
        let candidateHolding = await Holding.findOne({
          instrument: instrument._id,
          user: candidateOrder.user,
        })

        if (!candidateHolding) {
          candidateHolding = new Holding({
            instrument: instrument._id,
            user: candidateOrder.user,
            quantity: 0,
            averagePrice: 0,
          })
        }

        const existingPrice = candidateHolding.averagePrice
        const existingValue = candidateHolding.quantity * existingPrice
        const newValue = newTrade.quantity * newTrade.price
        candidateHolding.quantity += newTrade.quantity
        candidateHolding.averagePrice =
          (existingValue + newValue) / candidateHolding.quantity
        await candidateHolding.save()

        if (candidateUnmatchedQuantity === newTrade.quantity) {
          candidateOrder.status = 'executed'
        }

        const blockDeltaBuyer = new BlockDelta({
          user: candidateOrder.user,
          instrument: instrument._id,
          type: 'buy',
          quantity: newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        const blockDeltaSeller = new BlockDelta({
          user: newOrder.user,
          instrument: instrument._id,
          type: 'sell',
          quantity: -newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        await blockDeltaBuyer.save()
        await blockDeltaSeller.save()

        await newOrder.save()
        await candidateOrder.save()

        await User.updateOne(
          { _id: newOrder.user },
          { $inc: { cash: amountMatched - totalTradeCommission } }
        )
        await User.updateOne(
          { _id: candidateOrder.user },
          { $inc: { cash: -amountMatched } }
        )
        await User.updateOne(
          { _id: instrument.user },
          { $inc: { cash: newTrade.ownerCommission } }
        )
        await Transaction.insertMany([
          {
            user: newOrder.user,
            amount: amountMatched - totalTradeCommission,
            type: 'trade-sell',
            trade: newTrade._id,
          },
          {
            user: candidateOrder.user,
            amount: -amountMatched,
            type: 'trade-buy',
            trade: newTrade._id,
          },
          {
            user: instrument.user,
            amount: newTrade.ownerCommission,
            type: 'trade-commision',
            trade: newTrade._id,
          },
        ])

        instrument.delta = newTrade.price - instrument.ltp
        instrument.ltp = newTrade.price
        await instrument.save()

        if (newOrder.status === 'executed') {
          await Config.updateOne(
            { name: process.env.CONFIG_NAME },
            { $inc: { systemCommission: totalSystemCommission } }
          )
          return
        }
      }
    }
  }

  if (newOrder.type === 'limit') {
    if (newOrder.transactionType === 'buy') {
      // console.info('==> BUY')

      if (instrument.fresh) {
        // fresh buy
        if (newOrder.price >= instrument.ltp) {
          const newTrade = new Trade({
            buyer: newOrder.user,
            seller: instrument.user,
            instrument: instrument._id,
            price: newOrder.price,
            quantity: Math.min(newOrder.quantity, instrument.fresh),
            ownerCommission: FRESH_OWNER_RATE,
          })

          newTrade.systemCommission =
            newTrade.quantity * newTrade.price * FRESH_SYSTEM_RATE
          const totalCommission =
            newTrade.systemCommission + newTrade.ownerCommission

          totalSystemCommission += newTrade.systemCommission

          const freshOrder = new Order({
            user: instrument.user,
            instrument: instrument._id,
            quantity: newTrade.quantity,
            price: newTrade.price,
            transactionType: 'fresh-sell',
            status: 'executed',
            type: 'limit',
          })

          freshOrder.trades.push(newTrade._id)
          await freshOrder.save()

          await newTrade.save()
          qtyMatched += newTrade.quantity
          amountMatched += newTrade.quantity * newTrade.price

          newOrder.trades.push(newTrade)
          await newOrder.save()

          const existingPrice = holding.averagePrice
          const existingValue = holding.quantity * existingPrice
          const newValue = newTrade.quantity * newTrade.price
          holding.quantity += newTrade.quantity
          holding.averagePrice = (existingValue + newValue) / holding.quantity
          await holding.save()

          instrument.fresh -= newTrade.quantity
          instrument.floating += newTrade.quantity
          instrument.delta = newTrade.price - instrument.ltp
          instrument.ltp = newTrade.price
          await instrument.save()

          const blockDeltaBuyer = new BlockDelta({
            user: newOrder.user,
            instrument: instrument._id,
            type: 'fresh-buy',
            quantity: newTrade.quantity,
            data: {
              trade: newTrade._id,
            },
          })

          const blockDeltaSeller = new BlockDelta({
            user: instrument.user,
            instrument: instrument._id,
            type: 'fresh-sell',
            quantity: -newTrade.quantity,
            data: {
              trade: newTrade._id,
            },
          })

          await blockDeltaBuyer.save()
          await blockDeltaSeller.save()

          await User.updateOne(
            { _id: newOrder.user },
            { $inc: { cash: -amountMatched } }
          )
          await User.updateOne(
            { _id: instrument.user },
            { $inc: { cash: amountMatched - totalCommission } }
          )
          await Transaction.insertMany([
            {
              user: newOrder.user,
              amount: -amountMatched,
              type: 'trade-buy',
              trade: newTrade._id,
            },
            {
              user: instrument.user,
              amount: amountMatched - totalCommission,
              type: 'trade-fresh-sell',
              trade: newTrade._id,
            },
          ])
        }
      }

      if (qtyMatched === newOrder.quantity) {
        newOrder.status = 'executed'
        await newOrder.save()
        await Config.updateOne(
          { name: process.env.CONFIG_NAME },
          { $inc: { systemCommission: totalSystemCommission } }
        )
        return
      }

      // float buy
      const matchingOrders = await Order.find({
        status: 'pending',
        transactionType: 'sell',
        instrument: newOrder.instrument,
        price: {
          $lte: newOrder.price,
        },
        user: {
          $ne: newOrder.user,
        },
      })
        .populate('trades')
        .sort({ price: -1, createdAt: 1 })

      for (let i = 0; i < matchingOrders.length; i++) {
        const candidateOrder = matchingOrders[i]

        const qtyPending = newOrder.quantity - qtyMatched

        const candidateMatchedQuantity = candidateOrder.trades.reduce(
          (total, trade) => total + trade.quantity,
          0
        )

        const candidateUnmatchedQuantity =
          candidateOrder.quantity - candidateMatchedQuantity

        const newTrade = new Trade({
          buyer: newOrder.user,
          seller: candidateOrder.user,
          instrument: instrument._id,
          price: newOrder.price,
          quantity: Math.min(qtyPending, candidateUnmatchedQuantity),
        })

        newTrade.systemCommission =
          newTrade.quantity * newTrade.price * FLOAT_SYSTEM_RATE
        newTrade.ownerCommission =
          newTrade.quantity * newTrade.price * FLOAT_OWNER_RATE
        const totalTradeCommission =
          newTrade.systemCommission + newTrade.ownerCommission

        totalSystemCommission += newTrade.systemCommission

        await newTrade.save()
        qtyMatched += newTrade.quantity
        amountMatched += newTrade.quantity * newTrade.price

        newOrder.trades.push(newTrade)
        const existingPrice = holding.averagePrice
        const existingValue = holding.quantity * existingPrice
        const newValue = newTrade.quantity * newTrade.price
        holding.quantity += newTrade.quantity
        holding.averagePrice = (existingValue + newValue) / holding.quantity
        await holding.save()

        if (qtyMatched === newOrder.quantity) {
          newOrder.status = 'executed'
        }

        candidateOrder.trades.push(newTrade)
        if (candidateUnmatchedQuantity === newTrade.quantity) {
          candidateOrder.status = 'executed'
        }

        const blockDeltaBuyer = new BlockDelta({
          user: newOrder.user,
          instrument: instrument._id,
          type: 'buy',
          quantity: newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        const blockDeltaSeller = new BlockDelta({
          user: candidateOrder.user,
          instrument: instrument._id,
          type: 'sell',
          quantity: -newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        await blockDeltaBuyer.save()
        await blockDeltaSeller.save()

        await newOrder.save()
        await candidateOrder.save()

        await User.updateOne(
          { _id: newOrder.user },
          { $inc: { cash: -amountMatched } }
        )
        await User.updateOne(
          { _id: candidateOrder.user },
          { $inc: { cash: amountMatched - totalTradeCommission } }
        )
        await User.updateOne(
          { _id: instrument.user },
          { $inc: { cash: newTrade.ownerCommission } }
        )
        await Transaction.insertMany([
          {
            user: newOrder.user,
            amount: -amountMatched,
            type: 'trade-buy',
            trade: newTrade._id,
          },
          {
            user: candidateOrder.user,
            amount: amountMatched - totalTradeCommission,
            type: 'trade-sell',
            trade: newTrade._id,
          },
          {
            user: instrument.user,
            amount: newTrade.ownerCommission,
            type: 'trade-commision',
            trade: newTrade._id,
          },
        ])

        instrument.delta = newTrade.price - instrument.ltp
        instrument.ltp = newTrade.price
        await instrument.save()

        if (newOrder.status === 'executed') {
          await Config.updateOne(
            { name: process.env.CONFIG_NAME },
            { $inc: { systemCommission: totalSystemCommission } }
          )
          return
        }
      }
    }

    if (newOrder.transactionType === 'sell') {
      // console.info('==> SELL')

      // float sell
      const matchingOrders = await Order.find({
        status: 'pending',
        transactionType: 'buy',
        instrument: instrument._id,
        price: {
          $gte: newOrder.price,
        },
        user: {
          $ne: newOrder.user,
        },
      })
        .populate('trades')
        .sort({ price: -1, createdAt: 1 })

      for (let i = 0; i < matchingOrders.length; i++) {
        const candidateOrder = matchingOrders[i]

        const qtyPending = newOrder.quantity - qtyMatched

        const candidateMatchedQuantity = candidateOrder.trades.reduce(
          (total, trade) => total + trade.quantity,
          0
        )

        const candidateUnmatchedQuantity =
          candidateOrder.quantity - candidateMatchedQuantity

        const newTrade = new Trade({
          seller: newOrder.user,
          buyer: candidateOrder.user,
          instrument: newOrder.instrument,
          price: candidateOrder.price,
          quantity: Math.min(qtyPending, candidateUnmatchedQuantity),
        })

        newTrade.systemCommission =
          newTrade.quantity * newTrade.price * FLOAT_SYSTEM_RATE
        newTrade.ownerCommission =
          newTrade.quantity * newTrade.price * FLOAT_OWNER_RATE
        const totalTradeCommission =
          newTrade.systemCommission + newTrade.ownerCommission

        totalSystemCommission += newTrade.systemCommission

        await newTrade.save()
        qtyMatched += newTrade.quantity
        amountMatched += newTrade.quantity * newTrade.price

        newOrder.trades.push(newTrade)

        if (qtyMatched === newOrder.quantity) {
          newOrder.status = 'executed'
        }

        candidateOrder.trades.push(newTrade)
        let candidateHolding = await Holding.findOne({
          instrument: instrument._id,
          user: candidateOrder.user,
        })

        if (!candidateHolding) {
          candidateHolding = new Holding({
            instrument: instrument._id,
            user: candidateOrder.user,
            quantity: 0,
          })
        }

        const existingPrice = candidateHolding.averagePrice
        const existingValue = candidateHolding.quantity * existingPrice
        const newValue = newTrade.quantity * newTrade.price
        candidateHolding.quantity += newTrade.quantity
        candidateHolding.averagePrice =
          (existingValue + newValue) / candidateHolding.quantity
        await candidateHolding.save()

        if (candidateUnmatchedQuantity === newTrade.quantity) {
          candidateOrder.status = 'executed'
        }

        const blockDeltaBuyer = new BlockDelta({
          user: candidateOrder.user,
          instrument: instrument._id,
          type: 'buy',
          quantity: newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        const blockDeltaSeller = new BlockDelta({
          user: newOrder.user,
          instrument: instrument._id,
          type: 'sell',
          quantity: -newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        await blockDeltaBuyer.save()
        await blockDeltaSeller.save()

        await newOrder.save()
        await candidateOrder.save()

        await User.updateOne(
          { _id: newOrder.user },
          { $inc: { cash: amountMatched - totalTradeCommission } }
        )
        await User.updateOne(
          { _id: candidateOrder.user },
          { $inc: { cash: -amountMatched } }
        )
        await User.updateOne(
          { _id: instrument.user },
          { $inc: { cash: newTrade.ownerCommission } }
        )
        await Transaction.insertMany([
          {
            user: newOrder.user,
            amount: amountMatched - totalTradeCommission,
            type: 'trade-sell',
            trade: newTrade._id,
          },
          {
            user: candidateOrder.user,
            amount: -amountMatched,
            type: 'trade-buy',
            trade: newTrade._id,
          },
          {
            user: instrument.user,
            amount: newTrade.ownerCommission,
            type: 'trade-commision',
            trade: newTrade._id,
          },
        ])

        instrument.delta = newTrade.price - instrument.ltp
        instrument.ltp = newTrade.price
        await instrument.save()

        if (newOrder.status === 'executed') {
          await Config.updateOne(
            { name: process.env.CONFIG_NAME },
            { $inc: { systemCommission: totalSystemCommission } }
          )
          return
        }
      }
    }
  }
}
