const moment = require('moment-timezone')
const axios = require('axios')

const { PROCESSING_SERVER_URL } = process.env

const {
  User,
  Follower,
  Instrument,
  Watchlist,
  Tick,
  MessagingToken,
} = require('../models')

const stringSort = require('../utils/stringSort')
const { generateToken } = require('./auth')
const createNotification = require('../utils/createNotification')

const firebaseAdmin = require('../init-firebase')

exports.list_get = async (req, res) => {
  const { type } = req.query

  const query = {}

  if (type) {
    query.type = type
  }

  const select = 'avatar username firstName lastName isVerified'

  const populate = ''

  const sort = {
    username: 1,
  }

  try {
    const users = await User.find(query)
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

  const query = {
    username,
  }

  try {
    const user = await User.findOne(query)
      .select(
        'username firstName lastName bio avatar categories isVerified about'
      )
      .populate('followersCount followingCount')
      .lean({ virtuals: true })

    return res.send(user)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.details_get = async (req, res) => {
  const { userId } = req.params

  const query = {
    _id: userId,
  }

  try {
    const user = await User.findOne(query)
      .select(
        'username firstName lastName bio avatar categories isVerified about'
      )
      .lean()

    return res.send(user)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.profile_get = async (req, res) => {
  const { user } = req.decoded

  const query = {
    _id: user._id,
  }

  try {
    const existingUser = await User.findOne(query)
      .select(
        'username firstName lastName bio avatar categories isVerified verificationPending about cash bonusCash chips referralCode'
      )
      .lean({ virtuals: true })

    if (!existingUser) {
      return res.status(404).send({
        error: 'User not found',
      })
    }

    const token = generateToken(existingUser)

    return res.send({ user: existingUser, token })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.create_post = async (req, res) => {
  const { name, email, password, type } = req.body

  const newUser = new User({
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

  const { username, firstName, lastName, bio, avatar } = req.body

  const oldAvatar = user.avatar

  const updates = {
    username,
    firstName,
    lastName,
    bio,
    avatar,
  }

  try {
    await User.updateOne(
      {
        _id: user._id,
      },
      updates
    )

    if (oldAvatar !== avatar) {
      await axios
        .post(`${PROCESSING_SERVER_URL}/process/user/avatar`, {
          user: user._id,
        })
        .catch(console.error)
    }

    return res.send({ success: true })
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
  const { username } = req.params

  try {
    const user = await User.findOne({ username })

    if (!user) {
      return res.status(404).send({
        error: 'User not found',
      })
    }

    const query = {
      user: user._id,
    }

    const populate = [
      {
        path: 'follower',
        select: 'username avatar isVerified',
      },
    ]

    const sort = {
      'follower.username': 1,
    }

    const result = await Follower.find(query)
      .populate(populate)
      .sort(sort)
      .lean()

    const followers = result.map(f => f.follower)

    return res.send(followers)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.follower_single_get = async (req, res) => {
  const { followerId } = req.params

  try {
    const query = {
      _id: followerId,
    }

    const populate = [
      {
        path: 'follower',
        select: 'username avatar isVerified',
      },
    ]

    const result = await Follower.findOne(query).populate(populate)

    if (!result) {
      return res.status(404).send({
        error: 'Follower not found',
      })
    }

    return res.send(result.follower)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.following_get = async (req, res) => {
  const { username } = req.params

  try {
    const user = await User.findOne({ username })

    if (!user) {
      return res.status(404).send({
        error: 'User not found',
      })
    }

    const query = {
      follower: user._id,
    }

    const populate = [
      {
        path: 'user',
        select: 'username avatar isVerified',
      },
    ]

    const sort = {
      'user.username': 1,
    }

    const result = await Follower.find(query)
      .populate(populate)
      .sort(sort)
      .lean()

    const following = result.map(f => f.user)

    return res.send(following)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.isFollowing_get = async (req, res) => {
  const { user } = req.decoded
  const { userId } = req.params

  if (user._id === userId) {
    return res.send({ isFollowing: true })
  }

  try {
    const result = await Follower.findOne({
      user: userId,
      follower: user._id,
    })

    const isFollowing = !!result

    return res.send({ isFollowing })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.follower_put = async (req, res) => {
  const { user } = req.decoded
  const { userId } = req.params

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

    const newFollower = new Follower({
      user: userId,
      follower: user._id,
    })

    await newFollower.save()

    await createNotification(
      userId,
      'follow',
      {
        user: user._id,
        follower: newFollower._id,
      },
      `@${user.username} followed you`
    )

    return res.send({ success: true })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.follower_delete = async (req, res) => {
  const { user } = req.decoded
  const { userId } = req.params

  try {
    const follower = await Follower.findOne({
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

  const query = {
    user: userId,
  }

  try {
    const instrument = await Instrument.findOne(query).lean()

    const dayStartTick = await Tick.findOne({
      instrument: instrument._id,
      timestamp: {
        $gte: moment.tz('Asia/Kolkata').startOf('day').toDate(),
      },
    })
      .sort({ timestamp: 1 })
      .lean()

    instrument.dayStartTick = dayStartTick
    instrument.change =
      ((instrument.ltp - instrument.dayStartTick.price) * 100) /
      instrument.dayStartTick.price

    return res.send(instrument)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_watchlist_post = async (req, res) => {
  const { user } = req.decoded
  const { instrument } = req.body

  try {
    const watchExist = await Watchlist.findOne({
      user: user._id,
      instrument,
    })

    if (watchExist) {
      return res.status(400).send({
        error: 'Instrument already in watchlist',
      })
    }

    const userInstrument = new Watchlist({
      user: user._id,
      instrument,
    })

    await userInstrument.save()

    return res.send(userInstrument)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_watchlist_get = async (req, res) => {
  const { user } = req.decoded

  const query = {
    user: user._id,
  }

  const populate = [
    {
      path: 'instrument',
      populate: [
        {
          path: 'user',
          select: 'username avatar',
        },
      ],
    },
  ]

  try {
    const userInstruments = await Watchlist.find(query)
      .populate(populate)
      .lean()

    const instruments = userInstruments
      .map(i => i.instrument)
      .sort((a, b) => stringSort(a.user.username, b.user.username, false))

    return res.send(instruments)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_isWatching_get = async (req, res) => {
  const { user } = req.decoded
  const { instrument } = req.query

  try {
    const result = await Watchlist.findOne({
      user: user._id,
      instrument,
    })

    const isWatching = !!result

    return res.send({ isWatching })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_watchlist_delete = async (req, res) => {
  const { user } = req.decoded
  const { instrumentId } = req.params

  const query = {
    user: user._id,
    instrument: instrumentId,
  }

  try {
    const result = await Watchlist.deleteOne(query)

    return res.send(result)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_verify_post = async (req, res) => {
  const { user } = req.decoded
  const { selfie, pan } = req.body

  try {
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          verificationPending: true,
          verificationData: {
            selfie,
            pan,
          },
        },
      }
    )

    return res.send({ success: true })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_messagingToken_post = async (req, res) => {
  const { user } = req.decoded
  const { token } = req.body
  const device = req.headers['user-agent']

  try {
    const exisitingToken = await MessagingToken.findOne({
      user: user._id,
      token,
      device,
    })

    if (exisitingToken) {
      return res.send({ success: true })
    }

    const newToken = new MessagingToken({
      user: user._id,
      token,
      device,
      topics: [`user-${user._id}`, 'trades', 'posts', 'messages'],
    })

    await newToken.save()

    await Promise.all(
      newToken.topics.map(topic =>
        firebaseAdmin.messaging().subscribeToTopic(token, topic)
      )
    )

    return res.send({ success: true })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.user_messagingToken_delete = async (req, res) => {
  const { user } = req.decoded
  const { token } = req.body

  try {
    const result = await MessagingToken.deleteOne({
      user: user._id,
      token,
    })

    return res.send(result)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
