const Jimp = require('jimp')
const aws = require('aws-sdk')
const { User } = require('../../models')

const { S3_BUCKET } = process.env
aws.config.region = process.env.AWS_REGION

const s3 = new aws.S3()

module.exports = async job => {
  const userId = job?.attrs?.data
  try {
    const user = await User.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }

    if (!user.avatar) {
      throw new Error('Avatar not available')
    }

    console.info('user', user)

    const image = await Jimp.read(user.avatar)

    // resize
    const buffer = await image
      .clone()
      .resize(96, 96)
      .getBufferAsync(Jimp.MIME_PNG)

    await s3
      .putObject({
        Bucket: S3_BUCKET,
        Key: `users/avatar/${userId}.png`,
        Body: buffer,
        ContentType: Jimp.MIME_PNG,
        ACL: 'public-read',
      })
      .promise()

    user.avatar = `https://cdn.keepbuzzn.com/users/avatar/${userId}.png`

    await user.save()

    console.info('user', user)
  } catch (err) {
    console.error(err)
  }
}
