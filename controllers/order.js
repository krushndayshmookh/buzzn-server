const { Instrument, Order, Holding, User } = require('../models')
const tryMatching = require('../utils/tryMatching')

exports.fetchOrders_get = async (req, res) => {
  const { user } = req.decoded
  const { instrument, status, page, limit } = req.query

  const query = {
    user: user._id,
  }

  if (instrument) {
    query.instrument = instrument
  }

  if (status) {
    query.status = status
  }

  const sort = {
    createdAt: -1,
  }

  const populate = [
    {
      path: 'instrument',
      select: 'symbol user',
      populate: [
        {
          path: 'user',
          select: 'username',
        },
      ],
    },
    {
      path: 'trades',
      select: '-buyer -seller',
    },
  ]

  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
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
  const { user: tokenUser } = req.decoded
  const { transactionType, instrument: instrumentId, type } = req.body
  let { quantity, price } = req.body

  quantity = parseFloat(quantity)
  price = parseFloat(price)

  try {
    const instrument = await Instrument.findById(instrumentId)

    if (!instrument) {
      return res.status(404).send('Instrument not found')
    }

    const holding = await Holding.findOne({
      instrument: instrumentId,
      user: tokenUser._id,
    })

    const user = await User.findById(tokenUser._id)

    if (`${instrument.user}` === `${tokenUser._id}`) {
      return res.status(400).send('You cannot trade your own instrument')
    }

    const availableToSell = holding ? holding.quantity : 0

    const availableToBuy =
      instrument.floating + instrument.fresh - availableToSell

    if (transactionType === 'buy') {
      if (quantity > availableToBuy) {
        return res.status(400).send('Invalid quantity')
      }

      const amount = quantity * price
      if (amount > user.chips) {
        return res.status(400).send('Insufficient balance')
      }
    }

    if (transactionType === 'sell') {
      if (quantity > availableToSell) {
        return res.status(400).send('Invalid quantity')
      }
    }

    const newOrder = new Order({
      user: user._id,
      instrument: instrumentId,
      quantity,
      price: type === 'market' ? instrument.ltp : price,
      transactionType,
      type,
    })

    await newOrder.save()
    if (transactionType === 'sell') {
      holding.quantity -= quantity
      await holding.save()
    }

    try {
      await tryMatching(newOrder)
    } catch (err) {
      console.error({ err })
      return res.status(500).send({ err })
    }

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
    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).send('Order not found')
    }

    if (`${order.user}` !== user._id) {
      return res.status(403).send('Access denied')
    }

    if (order.status === 'pending') {
      order.status = 'cancelled'
      await order.save()

      if (order.transactionType === 'sell') {
        const holding = await Holding.findOne({
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

exports.fetchOrdersCount_get = async (req, res) => {
  const { user } = req.decoded
  const { instrument, status } = req.query

  const query = {
    user: user._id,
  }

  if (instrument) {
    query.instrument = instrument
  }

  if (status) {
    query.status = status
  }

  try {
    const count = await Order.countDocuments(query)
    return res.send({ count })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
