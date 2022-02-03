const { Instrument, BlockDelta } = require('../models')

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
