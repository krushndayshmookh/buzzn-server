const { Holding, Instrument } = require('../models')

exports.holdings_get = async (req, res) => {
  const { user } = req.decoded

  const { instrument } = req.query

  const query = {
    user: user._id,
  }

  const populate = [
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
    const holdings = await Holding.find(query).populate(populate).lean()

    return res.send(holdings)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.holders_get = async (req, res) => {
  const { user } = req.decoded

  const instrument = await Instrument.findOne({ user: user._id })

  const query = {
    instrument: instrument._id,
  }

  const populate = [
    {
      path: 'user',
      select: 'username avatar',
    },
  ]

  const sort = {
    quantity: -1,
  }

  try {
    const holdings = await Holding.find(query)
      .sort(sort)
      .populate(populate)
      .lean()

    return res.send(holdings)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
