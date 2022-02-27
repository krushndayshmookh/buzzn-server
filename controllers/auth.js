const jwt = require('jsonwebtoken')

const { User, Instrument } = require('../models')

exports.login_post = async (req, res) => {
  const { email, password } = req.body

  User.findOne({ email, password })
    .lean()
    .then(user => {
      if (user) {
        // Create a token
        const payload = { user }
        const options = {
          expiresIn: process.env.JWT_EXPIRES,
          issuer: process.env.JWT_ISSUER,
        }
        const secret = process.env.JWT_SECRET
        const token = jwt.sign(payload, secret, options)

        return res.send({
          success: true,
          token,
          user,
        })
      } else {
        return res.send({
          success: false,
        })
      }
    })
    .catch(err => {
      console.error(err)
      return res.status(500).send({ err })
    })
}

exports.register_post = async (req, res) => {
  const { username, email, password } = req.body

  let newUser = new User({
    username,
    email,
    password,
  })

  let newInstrument = new Instrument({
    user: newUser._id,
    minted: 0,
    symbol: 'BLOCK-' + username,
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

exports.login_status_get = (req, res) => {
  res.send({ success: true })
}
