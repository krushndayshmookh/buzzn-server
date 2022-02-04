const { Instrument, Order, Holding } = require('../models')
const tryMatching = require('../utils/tryMatching')

exports.fetchOrders_get = async (req, res) => {
  const { user } = req.decoded
  const { page, limit } = req.body

  let query = {
    user: user._id,
  }

  let sort = {
    createdAt: -1,
  }

  let populate = [
    {
      path: 'instrument',
      select: 'symbol',
    },
  ]

  let options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sort,
    populate,
  }

  try {
    let orders = []
    if (page) {
      orders = await Order.paginate(query, options)
    } else {
      orders = await Order.find(query).sort(sort).populate(populate)
    }
    return res.send(orders)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.placeOrder_post = async (req, res) => {
  const { user } = req.decoded
  const {
    transactionType,
    instrument: instrumentId,
    quantity,
    price,
    type,
  } = req.body

  try {
    let instrument = await Instrument.findById(instrumentId)

    if (!instrument) {
      return res.status(404).send('Instrument not found')
    }

    let holding = await Holding.findOne({
      instrument: instrumentId,
      user: user._id,
    })

    const availableToSell = holding ? holding.quantity : 0

    const availableToBuy =
      instrument.floating + instrument.fresh - availableToSell

    if (transactionType == 'buy') {
      if (quantity > availableToBuy) {
        return res.status(400).send('Invalid quantity')
      }
    }

    if (transactionType == 'sell') {
      if (quantity > availableToSell) {
        return res.status(400).send('Invalid quantity')
      }
    }

    let newOrder = new Order({
      user: user._id,
      instrument: instrumentId,
      quantity,
      price: type == 'market' ? instrument.ltp : price,
      transactionType,
      type,
    })

    await newOrder.save()
    if (transactionType == 'sell') {
      holding.quantity -= quantity
      await holding.save()
    }

    tryMatching(newOrder)

    // imeplement matching algorithm

    return res.send(newOrder)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.cancelOrder_delete = async (req, res) => {
  const { user } = req.decoded
  const { orderId } = req.params

  try {
    let order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).send('Order not found')
    }

    if (order.user != user._id) {
      return res.status(403).send('Access denied')
    }

    if (order.status == 'pending') {
      order.status = 'cancelled'
      await order.save()

      if (order.transactionType == 'sell') {
        let holding = await Holding.findOne({
          instrument: order.instrument,
          user: user._id,
        })

        holding.quantity += order.unmatchedQuantity
        await holding.save()
      }
      return res.send({ success: true })
    }

    return res.status(400).send('Order is already executed')
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
