const uniqueString = require('unique-string')

exports.key = () => uniqueString().substr(Math.floor(Math.random() * 16), 16)

exports.secret = () => uniqueString()
