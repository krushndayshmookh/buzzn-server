const { User, Transaction } = require('../models')

exports.users_get = async (req, res) => {
  const { verificationPending } = req.query

  const query = {}

  if (verificationPending === 'true') query.verificationPending = true

  try {
    const users = await User.find(query)
    return res.send(users)
  } catch (err) {
    console.error(err)
    return res.status(500).send(err)
  }
}

exports.users_put = async (req, res) => {
  const { userId } = req.params
  // const { type, isVerified, cash, about } = req.body

  const update = { ...req.body }

  // if (type) update.type = type
  // if (isVerified) update.isVerified = isVerified
  // if (cash) update.cash = cash
  // if (about) update.about = about

  try {
    const user = await User.findOne({ _id: userId })
    if (!user) return res.status(404).send('User not found')
    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
    })
    if (update.cash && update.cash !== user.cash) {
      const transaction = await Transaction.create({
        user: userId,
        amount: update.cash - user.cash,
        type: update.cash > user.cash ? 'admin-payment' : 'admin-payout',
      })

      console.info('Transaction created:', transaction._id)
    }
    return res.send(updatedUser)
  } catch (err) {
    console.error(err)
    return res.status(500).send(err)
  }
}

exports.stats_users_get = async (req, res) => {
  try {
    const stats = {
      total: await User.countDocuments(),
      real: await User.countDocuments({ type: 'base' }),
      bot: await User.countDocuments({ type: 'bot' }),
    }

    return res.send(stats)
  } catch (err) {
    console.error(err)
    return res.status(500).send(err)
  }
}
