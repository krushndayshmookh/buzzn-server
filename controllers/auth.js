const jwt = require('jsonwebtoken')

const { User, Instrument } = require('../models')

const JWTOptions = {
  expiresIn: process.env.JWT_EXPIRES,
  issuer: process.env.JWT_ISSUER,
}
const { JWT_SECRET } = process.env

const generateToken = user => jwt.sign({ user }, JWT_SECRET, JWTOptions)

exports.generateToken = generateToken

exports.login_post = async (req, res) => {
  const { email, password } = req.body

  User.findOne({ email })
    .select(
      'username firstName lastName bio avatar categories isVerified password'
    )
    .lean()
    .then(user => {
      if (!user) {
        return res
          .status(401)
          .send({ success: false, message: 'Invalid email' })
      }

      if (user.password === password) {
        const cleanUser = { ...user }
        delete cleanUser.password

        const token = generateToken(cleanUser)

        return res.send({
          success: true,
          token,
          cleanUser,
        })
      }

      return res
        .status(401)
        .send({ success: false, message: 'Invalid password' })
    })
    .catch(err => {
      console.error(err)
      return res.status(500).send({ err })
    })
}

exports.register_post = async (req, res) => {
  const { username, email, password } = req.body

  const newUser = new User({
    username,
    email,
    password,
  })

  const newInstrument = new Instrument({
    user: newUser._id,
    minted: 0,
    symbol: `BLOCK-${username}`,
  })

  try {
    await newUser.save()
    await newInstrument.save()
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
