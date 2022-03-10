const { Holding, Instrument } = require('../models')

exports.holdings_get = async (req, res) => {
  const { user } = req.decoded

  const { instrument } = req.query

  let query = {
    user: user._id,
  }

  let populate = [
    {
      path: 'instrument',
      select: 'symbol ltp',
      populate: [
        {
          path: 'user',
          select: 'username',
        },
      ],
    },
  ]

  if (instrument) query.instrument = instrument

  try {
    let holdings = await Holding.find(query).populate(populate).lean()

    res.send(holdings)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.holders_get = async (req, res) => {
  const { user } = req.decoded

  let instrument = await Instrument.findOne({ user: user._id })

  let query = {
    instrument: instrument._id,
  }

  let populate = [
    {
      path: 'user',
      select: 'username avatar',
    },
  ]

  let sort = {
    quantity: -1,
  }

  try {
    let holdings = await Holding.find(query)
      .sort(sort)
      .populate(populate)
      .lean()

    res.send(holdings)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
