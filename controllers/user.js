const { User, Follower } = require('../models')

exports.list_get = async (req, res) => {
  const { type } = req.query

  let query = {}

  if (type) {
    query.type = type
  }

  try {
    let users = await User.find(query).lean()

    return res.send(users)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.details_get = async (req, res) => {
  const { userId } = req.params

  let query = {
    _id: userId,
  }

  try {
    let user = await User.findOne(query).select('-password').lean()

    return res.send(user)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.create_post = async (req, res) => {
  const { name, email, password, type } = req.body

  let newUser = new User({
    name,
    email,
    password,
    type,
  })

  try {
    await newUser.save()

    return res.send(newUser)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.delete_delete = async (req, res) => {
  res.send({ success: true })
  // const { userId } = req.params

  // let query = {
  //   _id: userId,
  // }

  // try {
  //   await User.deleteOne(query)

  //   res.send({ success: true })
  // } catch (err) {
  //   console.error({ err })
  //   return res.status(500).send({ err })
  // }
}
