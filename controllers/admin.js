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
  const { type } = req.body

  try {
    const user = await User.findByIdAndUpdate(userId, { type }, { new: true })
    return res.send(user)
  } catch (err) {
    console.error(err)
    return res.status(500).send(err)
  }
}
