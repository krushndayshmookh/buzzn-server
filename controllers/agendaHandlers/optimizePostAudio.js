const Jimp = require('jimp')
const aws = require('aws-sdk')
const { Post } = require('../../models')

const { S3_BUCKET } = process.env
aws.config.region = process.env.AWS_REGION

const s3 = new aws.S3()

module.exports = async job => {
  const postId = job?.attrs?.data
  try {
    const post = await Post.findById(postId)
    if (!post) {
      throw new Error('Post not found')
    }

    console.info('post', post)

    const image = await Jimp.read(post.content.audio.cover.original)

    const coverBuffer = await image
      .clone()
      .resize(1024, 1024)
      .getBufferAsync(Jimp.MIME_PNG)

    await s3
      .putObject({
        Bucket: S3_BUCKET,
        Key: `posts/content/audio/cover/${postId}.png`,
        Body: coverBuffer,
        ContentType: Jimp.MIME_PNG,
        ACL: 'public-read',
      })
      .promise()

    const thumbnailBuffer = await image
      .clone()
      .resize(128, 128)
      .getBufferAsync(Jimp.MIME_PNG)

    await s3
      .putObject({
        Bucket: S3_BUCKET,
        Key: `posts/thumbnail/${postId}.png`,
        Body: thumbnailBuffer,
        ContentType: Jimp.MIME_PNG,
        ACL: 'public-read',
      })
      .promise()

    post.content.audio.thumbnail = `https://cdn.keepbuzzn.com/posts/thumbnail/${postId}.png`
    post.content.audio.cover.content = `https://cdn.keepbuzzn.com/posts/content/${postId}.png`

    await post.save()

    console.info('post', post)
  } catch (err) {
    console.error(err)
  }
}
