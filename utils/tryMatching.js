const { Order, Trade, Instrument, Holding } = require('../models')

module.exports = async newOrder => {
  let qtyMatched = 0
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
      if (newOrder.price > instrument.ltp) {
        let newTrade = new Trade({
          buyer: newOrder.user,
          seller: instrument.user,
          instrument: instrument._id,
          price: newOrder.price,
          quantity: Math.min(newOrder.quantity, instrument.fresh),
        })

        await newTrade.save()
        qtyMatched += newTrade.quantity

        newOrder.trades.push(newTrade)
        await newOrder.save()

        holding.quantity += newTrade.quantity
        await holding.save()

        instrument.fresh -= newTrade.quantity
        instrument.floating += newTrade.quantity
        instrument.delta = newOrder.price - instrument.ltp
        instrument.ltp = newOrder.price
        await instrument.save()
      }
    }

    if (qtyMatched == newOrder.quantity) {
      newOrder.status = 'executed'
      await newOrder.save()
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
        $ne: newOrder.user
      }
    }).sort({ createdAt: 1 })

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

      newOrder.trades.push(newTrade)
      holding.quantity += newTrade.quantity

      if (qtyMatched == newOrder.quantity) {
        newOrder.status = 'executed'
      }

      candidateOrder.trades.push(newTrade)
      if (candidateOrder.unmatchedQuantity == newTrade.quantity) {
        candidateOrder.status = 'executed'
      }

      await newOrder.save()
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
        $ne: newOrder.user
      }
    }).sort({ createdAt: 1 })

    for (let candidateOrder of matchingOrders) {
      let qtyPending = newOrder.quantity - qtyMatched

      let newTrade = new Trade({
        buyer: newOrder.user,
        seller: candidateOrder.user,
        instrument: newOrder.instrument,
        price: candidateOrder.price,
        quantity: Math.min(qtyPending, candidateOrder.unmatchedQuantity),
      })

      await newTrade.save()
      qtyMatched += newTrade.quantity

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

      await newOrder.save()
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
