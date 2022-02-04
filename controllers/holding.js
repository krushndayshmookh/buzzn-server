const { Holding } = require('../models')

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
