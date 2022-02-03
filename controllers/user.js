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


exports.followers_get = async (req, res) => {
  let { userId } = req.params

  let query = {
    user: userId,
  }

  let populate = [
    {
      path: 'follower',
      select: 'username avatar',
    },
  ]

  let sort = {
    'follower.username': 1,
  }

  try {
    let result = await Follower.find(query).populate(populate).sort(sort).lean()

    let followers = result.map(f => f.follower)

    return res.send(followers)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.isFollowing_get = async (req, res) => {
  let { user } = req.decoded
  let { userId } = req.params

  if (user._id == userId) {
    return res.send({ isFollowing: true })
  }

  try {
    let result = await Follower.findOne({
      user: userId,
      follower: user._id,
    })

    let isFollowing = !!result

    return res.send({ isFollowing })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.follower_put = async (req, res) => {
  let { user } = req.decoded
  let { userId } = req.params

  try {
    const userToFollow = await User.findById(userId)

    if (!userToFollow) {
      return res.status(404).send({
        error: 'User not found',
      })
    }

    const follower = await Follower.findOne({
      user: userId,
      follower: user._id,
    })

    if (follower) {
      return res.status(400).send({
        error: 'You have already followed this user',
      })
    }

    let newFollower = new Follower({
      user: userId,
      follower: user._id,
    })

    await newFollower.save()

    return res.send({ success: true })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.follower_delete = async (req, res) => {
  let { user } = req.decoded
  let { userId } = req.params

  try {
    let follower = await Follower.findOne({
      user: userId,
      follower: user._id,
    })

    if (!follower) {
      return res.status(404).send({
        error: 'Follower not found',
      })
    }

    await follower.remove()

    return res.send({ success: true })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
