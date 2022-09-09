const moment = require('moment-timezone')
const { Instrument, BlockDelta, Order, Tick } = require('../models')

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
    const dayStartTick = await Tick.findOne({
      instrument: instrumentId,
      timestamp: {
        $gte: moment.tz('Asia/Kolkata').startOf('day').toDate(),
      },
    })
      .sort({ timestamp: 1 })
      .lean()

    instrument.dayStartTick = dayStartTick
    instrument.change =
      (instrument.ltp - instrument.dayStartTick.price) /
      instrument.dayStartTick.price

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
  let { timespan } = req.query

  try {
    const instrument = await Instrument.findById(instrumentId)

    if (!instrument) {
      return res.status(404).send({ error: 'instrument not found' })
    }

    const NOW = moment().tz('Asia/Kolkata')

    let startDate
    let step

    if (!timespan) timespan = 'W'

    switch (timespan) {
      case 'D':
        startDate = moment(NOW).startOf('day').toDate()
        step = 1
        break
      case 'W':
        startDate = moment(NOW).subtract(1, 'weeks').toDate()
        step = 30
        break
      case 'M':
        startDate = moment(NOW).subtract(1, 'months').toDate()
        step = 120
        break
      case 'Y':
        startDate = moment(NOW).subtract(1, 'years').toDate()
        step = 1440
        break
      case 'A':
        startDate = moment('2022-01-01').toDate()
        step = 1440
        break
      default:
        startDate = moment(NOW).subtract(1, 'days').toDate()
        step = 5
    }

    const query = {
      instrument: instrument._id,
      timestamp: {
        $gte: startDate,
      },
    }

    const sort = {
      timestamp: 1,
    }

    const project = {
      _id: 0,
      timestamp: {
        $toLong: '$timestamp',
      },
      price: 1,
    }

    let chart = []

    chart = await Tick.aggregate([
      { $match: query },
      { $sort: sort },
      { $project: project },
    ])

    chart = chart.filter((tick, index) => index % step === 0)

    if (!chart.length) {
      chart = [
        {
          createdAt: new moment(instrument.createdAt).valueOf(),
          price: instrument.ltp,
        },
        {
          createdAt: NOW.valueOf(),
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
