const moment = require('moment-timezone')
const { Instrument, BlockDelta, Order, Trade } = require('../models')

exports.instruments_list_get = async (req, res) => {
  try {
    const instruments = await Instrument.find({}).lean()

    return res.send(instruments)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.instrument_get = async (req, res) => {
  const { instrumentId } = req.params

  const query = {
    _id: instrumentId,
  }

  try {
    const instrument = await Instrument.findOne(query).lean()

    return res.send(instrument)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.blocks_float_post = async (req, res) => {
  const { user } = req.decoded

  let { quantity } = req.body

  quantity = parseInt(quantity, 10) || 0

  try {
    const instrument = await Instrument.findOne({
      user: user._id,
    })

    if (!instrument) {
      return res.status(404).send({ error: 'instrument not found' })
    }

    if (instrument.minted < quantity) {
      return res.status(400).send({ error: 'insufficient minted' })
    }

    instrument.minted -= quantity
    instrument.fresh += quantity

    await instrument.save()

    const newBlockDelta = new BlockDelta({
      user: user._id,
      instrument: instrument._id,
      type: 'float',
      data: {
        instrument: instrument._id,
        quantity,
        action: 'float',
        description: `${quantity} blocks floated by ${user.firstName} ${user.lastName}.`,
      },
      quantity,
    })

    await newBlockDelta.save()
    return res.status(201).send(instrument)
  } catch (error) {
    console.error({ error })
    return res.status(500).send({ error })
  }
}

exports.market_depth_get = async (req, res) => {
  const { instrumentId } = req.params

  try {
    const instrument = await Instrument.findById(instrumentId)

    if (!instrument) {
      return res.status(404).send({ error: 'instrument not found' })
    }

    const querySell = {
      instrument: instrumentId,
      status: 'pending',
      transactionType: 'sell',
    }

    const queryBuy = {
      instrument: instrumentId,
      status: 'pending',
      transactionType: 'buy',
    }

    const sort = {
      price: -1,
    }

    const select = 'price quantity'

    const sellOrders = await Order.find(querySell)
      .sort(sort)
      .select(select)
      .limit(5)
      .lean()
    const buyOrders = await Order.find(queryBuy)
      .sort(sort)
      .select(select)
      .limit(5)
      .lean()

    return res.send({ asks: sellOrders, bids: buyOrders })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.chart_get = async (req, res) => {
  const { instrumentId } = req.params

  try {
    const instrument = await Instrument.findById(instrumentId)

    if (!instrument) {
      return res.status(404).send({ error: 'instrument not found' })
    }

    const queryWithDate = {
      instrument: instrument._id,
      createdAt: {
        $gte: moment().subtract(7, 'days').toDate(),
      },
    }

    const queryWithLimit = {
      instrument: instrument._id,
    }

    const limit = 100

    const sort = {
      createdAt: 1,
    }

    const project = {
      createdAt: {
        $toLong: '$createdAt',
      },
      price: 1,
    }

    let chart = []

    chart = await Trade.aggregate([
      { $match: queryWithDate },
      { $sort: sort },
      { $project: project },
    ])

    if (!chart.length) {
      chart = await Trade.aggregate([
        { $match: queryWithLimit },
        { $sort: sort },
        { $limit: limit },
        { $project: project },
      ])
    }

    if (!chart.length) {
      chart = [
        {
          createdAt: new moment(instrument.createdAt).valueOf(),
          price: instrument.ltp,
        },
        {
          createdAt: new moment.tz('Asia/Kolkata').valueOf(),
          price: instrument.ltp,
        },
      ]
    }

    return res.send(chart)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
