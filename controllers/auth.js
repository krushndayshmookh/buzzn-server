const jwt = require('jsonwebtoken')

const { User, Instrument } = require('../models')

const firebaseAdmin = require('../init-firebase')

const { sendForgotPasswordMail } = require('../utils/sendTemplatedMail')

const JWTOptions = {
  expiresIn: process.env.JWT_EXPIRES,
  issuer: process.env.JWT_ISSUER,
}
const { JWT_SECRET } = process.env

const generateToken = user => jwt.sign({ user }, JWT_SECRET, JWTOptions)

const createNewUser = async userData => {
  const { referrer } = userData

  const newUser = new User(userData)

  const newInstrument = new Instrument({
    user: newUser._id,
    minted: 0,
    symbol: `BLOCK-${newUser.username}`,
  })

  Instrument.find({ symbol: newInstrument.symbol }).then(instrument => {
    if (instrument.length > 0) {
      newInstrument.symbol = `BLOCK-${newUser.username}-${instrument.length}`
    }
  })

  await newUser.save()
  await newInstrument.save()

  if (referrer) {
    const referrerUser = await User.findOne({ referralCode: referrer })
    if (referrerUser) {
      referrerUser.bonusCash += 50
      await referrerUser.save()
    }
  }

  return newUser
}

exports.generateToken = generateToken

exports.login_post = async (req, res) => {
  const { email, password, authProvider = 'local', idToken } = req.body

  const query = { email }

  let decodedToken

  if (authProvider === 'firebase') {
    if (!idToken) {
      return res.status(400).json({ error: 'Missing idToken' })
    }

    try {
      decodedToken = await firebaseAdmin.auth().verifyIdToken(idToken)
      const { email: googleEmail } = decodedToken
      query.email = googleEmail
    } catch (error) {
      return res.status(400).json({ error: 'Invalid idToken' })
    }
  }

  if (authProvider === 'local') {
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' })
    }
    query.password = password
  }

  try {
    let user = await User.findOne(query)
      .select(
        'username firstName lastName bio avatar categories isVerified email'
      )
      .lean()

    if (!user) {
      if (authProvider === 'local') {
        return res.status(401).send({
          success: false,
          message:
            'Invalid email or auth provider. Maybe try signing in with Google instead?',
        })
      }

      if (authProvider === 'firebase') {
        const newUser = await createNewUser({
          username: decodedToken.name.toLowerCase().replace(' ', '-'),
          email: decodedToken.email,
          avatar: decodedToken.picture,
          authProvider: 'firebase',
        })

        user = {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          avatar: newUser.avatar,
          isVerified: newUser.isVerified,
        }
      }
    }

    const token = generateToken(user)

    return res.send({
      success: true,
      token,
      user,
    })
  } catch (err) {
    console.error(err)
    return res.status(500).send({ err })
  }
}

exports.register_post = async (req, res) => {
  const { username, email, password, referrer } = req.body

  try {
    await createNewUser({
      username,
      email,
      password,
      referrer,
    })

    return res.status(201).send({ success: true })
  } catch (err) {
    if (err.code === 11000) {
      return res
        .status(409)
        .send({ success: false, message: 'Email already exists' })
    }

    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.login_status_get = async (req, res) => {
  const { _id } = req.decoded.user

  const user = await User.findOne({ _id }).select('-password')

  if (!user) {
    return res.status(401).send({ success: false, message: 'Invalid user' })
  }

  return res.send({ success: true, user })
}

exports.forgotPassword_post = async (req, res) => {
  const { email } = req.body

  try {
    const user = await User.findOne({ email }).lean()

    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' })
    }

    const resetToken = generateToken({ _id: user._id, email })

    await sendForgotPasswordMail({
      username: user.username,
      email,
      token: resetToken,
    })

    return res.send({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).send({ err })
  }
}

exports.resetPassword_post = async (req, res) => {
  const { token, password } = req.body

  try {
    const { _id, email } = jwt.verify(token, JWT_SECRET)

    await User.updateOne({ _id, email }, { $set: { password } })

    return res.send({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).send({ err })
  }
}
