const uniqueString = import('unique-string')

exports.key = () => uniqueString().substr(Math.floor(Math.random() * 16), 16)

exports.secret = () => uniqueString()

exports.string = length => {
  let result = ''
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}
