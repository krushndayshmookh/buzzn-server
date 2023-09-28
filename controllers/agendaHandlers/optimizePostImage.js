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

    const image = await Jimp.read(post.content.image.original)

    // resize
    const buffer = await image
      .clone()
      .resize(1024, 1024)
      .getBufferAsync(Jimp.MIME_PNG)

    await s3
      .putObject({
        Bucket: S3_BUCKET,
        Key: `posts/content/${postId}.png`,
        Body: buffer,
        ContentType: Jimp.MIME_PNG,
        ACL: 'public-read',
      })
      .promise()

    // thumbnail
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

    // blurry
    const blurryBuffer = await image
      .clone()
      .resize(256, 256)
      .blur(30)
      .getBufferAsync(Jimp.MIME_PNG)

    await s3
      .putObject({
        Bucket: S3_BUCKET,
        Key: `posts/blurry/${postId}.png`,
        Body: blurryBuffer,
        ContentType: Jimp.MIME_PNG,
        ACL: 'public-read',
      })
      .promise()

    post.content.image.thumbnail = `https://cdn.keepbuzzn.com/posts/thumbnail/${postId}.png`
    post.content.image.content = `https://cdn.keepbuzzn.com/posts/content/${postId}.png`
    post.content.image.blurry = `https://cdn.keepbuzzn.com/posts/blurry/${postId}.png`

    await post.save()

    console.info('post', post)
  } catch (err) {
    console.error(err)
  }
}
