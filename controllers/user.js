const { User, Follower, Instrument, Watchlist } = require('../models')
const nameSort = require('../utils/nameSort')

exports.list_get = async (req, res) => {
  const { type } = req.query

  let query = {}

  if (type) {
    query.type = type
  }

  let select = 'avatar username firstName lastName isVerified'

  let populate = ''

  let sort = {
    username: 1,
  }

  try {
    let users = await User.find(query)
      .select(select)
      .collation({ locale: 'en' })
      .sort(sort)
      .populate(populate)
      .lean()

    return res.send(users)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.byUsername_get = async (req, res) => {
  const { username } = req.params

  let query = {
    username,
  }

  try {
    let user = await User.findOne(query)
      .select('username firstName lastName avatar categories isVerified')
      .populate('followersCount followingCount')
    // .lean({ virtuals: true })

    return res.send(user)
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
    let user = await User.findOne(query).select('username isVerified').lean()

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

exports.update_put = async (req, res) => {
  const { user } = req.decoded

  const { username, email, firstName, lastName, website, avatar_url } = req.body

  let updates = {
    username,
    email,
    firstName,
    lastName,
    website,
    avatar_url,
  }

  try {
    await User.updateOne(
      {
        _id: user._id,
      },
      updates
    )

    res.send({ success: true })
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
  let { username } = req.params

  try {
    let user = await User.findOne({ username })

    if (!user) {
      return res.status(404).send({
        error: 'User not found',
      })
    }

    let query = {
      user: user._id,
    }

    let populate = [
      {
        path: 'follower',
        select: 'username avatar isVerified',
      },
    ]

    let sort = {
      'follower.username': 1,
    }

    let result = await Follower.find(query).populate(populate).sort(sort).lean()

    let followers = result.map(f => f.follower)

    return res.send(followers)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.following_get = async (req, res) => {
  let { username } = req.params

  try {
    let user = await User.findOne({ username })

    if (!user) {
      return res.status(404).send({
        error: 'User not found',
      })
    }

    let query = {
      follower: user._id,
    }

    let populate = [
      {
        path: 'user',
        select: 'username avatar isVerified',
      },
    ]

    let sort = {
      'user.username': 1,
    }

    let result = await Follower.find(query).populate(populate).sort(sort).lean()

    let following = result.map(f => f.user)

    return res.send(following)
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

exports.user_instrument_get = async (req, res) => {
  const { userId } = req.params

  let query = {
    user: userId,
  }

  try {
    let instrument = await Instrument.findOne(query).lean()

    return res.send(instrument)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_watchlist_post = async (req, res) => {
  const { user } = req.decoded
  const { instrument } = req.body

  let userInstrument = new Watchlist({
    user: user._id,
    instrument,
  })

  try {
    await userInstrument.save()

    return res.send(userInstrument)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_watchlist_get = async (req, res) => {
  const { user } = req.decoded

  let query = {
    user: user._id,
  }

  let populate = [{ path: 'instrument' }]

  try {
    let userInstruments = await Watchlist.find(query).populate(populate).lean()
    let instruments = userInstruments.map(i => i.instrument).sort(nameSort)

    return res.send(instruments)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_isWatching_get = async (req, res) => {
  let { user } = req.decoded
  const { instrument } = req.query

  try {
    let result = await Watchlist.findOne({
      user: user._id,
      instrument: instrument,
    })

    let isWatching = !!result

    return res.send({ isWatching })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_watchlist_delete = async (req, res) => {
  const { user } = req.decoded
  const { instrumentId } = req.params

  let query = {
    user: user._id,
    instrument: instrumentId,
  }

  try {
    let result = await Watchlist.deleteOne(query)

    return res.send(result)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
