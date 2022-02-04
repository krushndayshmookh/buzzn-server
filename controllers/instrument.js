const { Instrument, BlockDelta, Order, Trade } = require('../models')
const moment = require('moment-timezone')

exports.instruments_list_get = async (req, res) => {
  try {
    let instruments = await Instrument.find({}).lean()

    res.send(instruments)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.instrument_get = async (req, res) => {
  let { instrumentId } = req.params

  let query = {
    _id: instrumentId,
  }
  try {
    let instrument = await Instrument.findOne(query).lean()

    res.send(instrument)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.blocks_float_post = async (req, res) => {
  const { user } = req.decoded

  const { quantity } = req.body

  try {
    let instrument = await Instrument.findOne({
      user: user._id,
    })

    if (!instrument) {
      return res.status(404).send({ error: 'instrument not found' })
    }

    if (instrument.minted < quantity) {
      return res.status(400).send({ error: 'insufficient minted' })
    }

    instrument.minted = instrument.minted - quantity
    instrument.fresh = instrument.fresh + quantity

    await instrument.save()

    let newBlockDelta = new BlockDelta({
      user: user._id,
      instrument: instrument._id,
      type: 'float',
      data: {
        instrument: instrument._id,
        quantity: quantity,
        action: 'float',
        description: `${quantity} blocks floated by ${user.firstName} ${user.lastName}.`,
      },
      quantity: quantity,
    })

    await newBlockDelta.save()
    return res.status(201).send(instrument)
  } catch (error) {
    console.error({ error })
    return res.status(500).send({ error })
  }
}

exports.market_depth_get = async (req, res) => {
  let { instrumentId } = req.params

  try {
    let instrument = await Instrument.findById(instrumentId)

    if (!instrument) {
      return res.status(404).send({ error: 'instrument not found' })
    }

    let querySell = {
      instrument: instrumentId,
      status: 'pending',
      transactionType: 'sell',
    }

    let queryBuy = {
      instrument: instrumentId,
      status: 'pending',
      transactionType: 'buy',
    }

    let sort = {
      price: -1,
    }

    let select = 'price quantity'

    let sellOrders = await Order.find(querySell)
      .sort(sort)
      .select(select)
      .limit(5)
      .lean()
    let buyOrders = await Order.find(queryBuy)
      .sort(sort)
      .select(select)
      .limit(5)
      .lean()

    res.send({ asks: sellOrders, bids: buyOrders })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.chart_get = async (req, res) => {
  let { instrumentId } = req.params

  try {
    let instrument = await Instrument.findById(instrumentId)

    if (!instrument) {
      return res.status(404).send({ error: 'instrument not found' })
    }

    let query = {
      instrument: instrumentId,
      createdAt: {
        $gte: moment().subtract(1, 'months').toDate(),
      },
    }

    let sort = {
      createdAt: 1,
    }

    let select = 'createdAt price'

    let chart = await Trade.find(query)
      .sort(sort)
      .select(select)
      .lean()

    res.send(chart)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}