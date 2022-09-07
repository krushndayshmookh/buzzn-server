const { User } = require('../models')

exports.users_get = async (req, res) => {
  try {
    const users = await User.find()
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
    const user = await User.findByIdAndUpdate(userId, update, { new: true })
    return res.send(user)
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
