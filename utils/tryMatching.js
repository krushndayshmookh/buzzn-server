const { Order, Trade, Instrument, Holding, User, BlockDelta } = require('../models')

module.exports = async newOrder => {
  let qtyMatched = 0
  let amountMatched = 0
  let instrument = await Instrument.findById(newOrder.instrument)
  let holding = await Holding.findOne({
    instrument: instrument._id,
    user: newOrder.user,
  })

  if (!holding) {
    holding = new Holding({
      instrument: instrument._id,
      user: newOrder.user,
      quantity: 0,
    })
  }

  if (newOrder.transactionType == 'buy') {
    if (instrument.fresh) {
      if (newOrder.price >= instrument.ltp) {
        let newTrade = new Trade({
          buyer: newOrder.user,
          seller: instrument.user,
          instrument: instrument._id,
          price: newOrder.price,
          quantity: Math.min(newOrder.quantity, instrument.fresh),
        })

        await newTrade.save()
        qtyMatched += newTrade.quantity
        amountMatched += newTrade.quantity * newTrade.price

        newOrder.trades.push(newTrade)
        await newOrder.save()

        holding.quantity += newTrade.quantity
        await holding.save()

        instrument.fresh -= newTrade.quantity
        instrument.floating += newTrade.quantity
        instrument.delta = newOrder.price - instrument.ltp
        instrument.ltp = newOrder.price
        await instrument.save()

        const blockDeltaBuyer = new BlockDelta({
          user: newOrder.user,
          instrument: instrument._id,
          type: 'trade-fresh-buy',
          quantity: newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        const blockDeltaSeller = new BlockDelta({
          user: instrument.user,
          instrument: instrument._id,
          type: 'trade-fresh-sell',
          quantity: -newTrade.quantity,
          data: {
            trade: newTrade._id,
          },
        })

        await blockDeltaBuyer.save()
        await blockDeltaSeller.save()
      }
    }

    if (qtyMatched == newOrder.quantity) {
      newOrder.status = 'executed'
      await newOrder.save()
      await User.updateOne(
        { _id: newOrder.user },
        { $inc: { chips: -amountMatched } }
      )
      await User.updateOne(
        { _id: instrument.user },
        { $inc: { chips: +amountMatched } }
      )
      return
    }

    let matchingOrders = await Order.find({
      status: 'pending',
      transactionType: 'sell',
      instrument: newOrder.instrument,
      price: {
        $lte: newOrder.price,
      },
      user: {
        $ne: newOrder.user,
      },
    }).sort({ price: -1, createdAt: 1 })

    for (let candidateOrder of matchingOrders) {
      let qtyPending = newOrder.quantity - qtyMatched

      let newTrade = new Trade({
        buyer: newOrder.user,
        seller: candidateOrder.user,
        instrument: instrument._id,
        price: newOrder.price,
        quantity: Math.min(qtyPending, candidateOrder.unmatchedQuantity),
      })

      await newTrade.save()
      qtyMatched += newTrade.quantity
      amountMatched += newTrade.quantity * newTrade.price

      newOrder.trades.push(newTrade)
      holding.quantity += newTrade.quantity

      if (qtyMatched == newOrder.quantity) {
        newOrder.status = 'executed'
      }

      candidateOrder.trades.push(newTrade)
      if (candidateOrder.unmatchedQuantity == newTrade.quantity) {
        candidateOrder.status = 'executed'
      }

      const blockDeltaBuyer = new BlockDelta({
        user: newOrder.user,
        instrument: instrument._id,
        type: 'trade-buy',
        quantity: newTrade.quantity,
        data: {
          trade: newTrade._id,
        },
      })

      const blockDeltaSeller = new BlockDelta({
        user: candidateOrder.user,
        instrument: instrument._id,
        type: 'trade-sell',
        quantity: -newTrade.quantity,
        data: {
          trade: newTrade._id,
        },
      })

      await blockDeltaBuyer.save()
      await blockDeltaSeller.save()

      await newOrder.save()
      await User.updateOne(
        { _id: newOrder.user },
        { $inc: { chips: -amountMatched } }
      )
      await User.updateOne(
        { _id: candidateOrder.user },
        { $inc: { chips: amountMatched } }
      )
      await candidateOrder.save()
      await holding.save()

      instrument.delta = newOrder.price - instrument.ltp
      instrument.ltp = newOrder.price
      await instrument.save()

      if (newOrder.status == 'executed') {
        return
      }
    }
  }

  if (newOrder.transactionType == 'sell') {
    let matchingOrders = await Order.find({
      status: 'pending',
      transactionType: 'buy',
      instrument: instrument._id,
      price: {
        $gte: newOrder.price,
      },
      user: {
        $ne: newOrder.user,
      },
    }).sort({ price: -1, createdAt: 1 })

    for (let candidateOrder of matchingOrders) {
      let qtyPending = newOrder.quantity - qtyMatched

      let newTrade = new Trade({
        seller: newOrder.user,
        buyer: candidateOrder.user,
        instrument: newOrder.instrument,
        price: candidateOrder.price,
        quantity: Math.min(qtyPending, candidateOrder.unmatchedQuantity),
      })

      await newTrade.save()
      qtyMatched += newTrade.quantity
      amountMatched += newTrade.quantity * newTrade.price

      newOrder.trades.push(newTrade)

      if (qtyMatched == newOrder.quantity) {
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
      candidateHolding.quantity += newTrade.quantity

      if (candidateOrder.unmatchedQuantity == newTrade.quantity) {
        candidateOrder.status = 'executed'
      }

      const blockDeltaBuyer = new BlockDelta({
        user: candidateOrder.user,
        instrument: instrument._id,
        type: 'trade-buy',
        quantity: newTrade.quantity,
        data: {
          trade: newTrade._id,
        },
      })

      const blockDeltaSeller = new BlockDelta({
        user: newOrder.user,
        instrument: instrument._id,
        type: 'trade-sell',
        quantity: -newTrade.quantity,
        data: {
          trade: newTrade._id,
        },
      })

      await blockDeltaBuyer.save()
      await blockDeltaSeller.save()

      await newOrder.save()
      await User.updateOne(
        { _id: newOrder.user },
        { $inc: { chips: amountMatched } }
      )
      await User.updateOne(
        { _id: candidateOrder.user },
        { $inc: { chips: -amountMatched } }
      )
      await candidateHolding.save()
      await candidateOrder.save()

      instrument.delta = newOrder.price - instrument.ltp
      instrument.ltp = newOrder.price
      await instrument.save()

      if (newOrder.status == 'executed') {
        return
      }
    }
  }
}
