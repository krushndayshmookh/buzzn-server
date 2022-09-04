const jwt = require('jsonwebtoken')

const validateTokenOptional = (req, res, next) => {
  const authorizationHeader = req.headers.authorization
  let result
  if (authorizationHeader) {
    const token = req.headers.authorization.split(' ')[1] // Bearer <token>
    const options = {
      expiresIn: process.env.JWT_EXPIRES,
      issuer: process.env.JWT_ISSUER,
    }
    const secret = process.env.JWT_SECRET
    try {
      // verify makes sure that the token hasn't expired and has been issued by us
      result = jwt.verify(token, secret, options)

      // Let's pass back the decoded token to the request object
      req.decoded = result
      // We call next to pass execution to the subsequent middleware
    } catch (err) {
      req.decoded = null
      next()
    }
  }
  next()
}

module.exports = validateTokenOptional
