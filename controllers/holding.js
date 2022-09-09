const { Holding, Instrument } = require('../models')

exports.holdings_get = async (req, res) => {
  const { user } = req.decoded

  const { instrument, self = 'true', sort = 'false' } = req.query

  if (!self && !instrument) {
    return res.status(400).send({ err: 'Please provide instrument' })
  }

  const query = {
    quantity: { $gt: 0 },
  }

  if (self === 'true') {
    query.user = user._id
  }

  const populate = [
    {
      path: 'instrument',
      select: 'symbol ltp',
      populate: [
        {
          path: 'user',
          select: 'username avatar',
        },
      ],
    },
    {
      path: 'user',
      select: 'username avatar instrument',
    },
  ]

  if (instrument) query.instrument = instrument

  const sortO = sort === 'true' ? { createdAt: -1 } : { quantity: -1 }

  try {
    const holdings = await Holding.find(query)
      .sort(sortO)
      .populate(populate)
      .lean({ virtuals: true })

    return res.send(holdings)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
