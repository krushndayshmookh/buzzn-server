const aws = require('aws-sdk')

const fs = require('fs-extra')

const FfmpegCommand = require('fluent-ffmpeg')
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

    console.info('post', post.content.video)

    await fs.ensureDir('/tmp')

    const inVideo = await s3
      .getObject({
        Bucket: S3_BUCKET,
        Key: `${post.content.video.originalFilename}`,
      })
      .createReadStream()

    // generate thumbnail gif
    new FfmpegCommand(inVideo)
      // .inputFormat('webm')
      // .setStartTime(0) // Can be in "HH:MM:SS" format also
      // .setDuration(5)
      .size('128x128')
      .format('gif')
      .fps(5)
      .on('start', commandLine => {
        console.info(`Spawned FFmpeg with command: ${commandLine}`)
      })
      .on('error', transformError => {
        console.info('error: ', transformError)
      })
      .on('end', async () => {
        console.info('gif generation Done')

        const params = {
          Bucket: S3_BUCKET,
          Key: `posts/thumbnail/${postId}.gif`,
          Body: fs.createReadStream(`/tmp/${postId}.gif`),
          ContentType: 'image/gif',
          ACL: 'public-read',
        }
        try {
          await s3.putObject(params).promise()
          console.info('uploaded', params.Key)
        } catch (uploadError) {
          console.info('uploadError', uploadError)
        }
      })
      .saveToFile(`/tmp/${postId}.gif`)

    post.content.video.thumbnail = `https://cdn.keepbuzzn.com/posts/thumbnail/${postId}.gif`

    await post.save()
  } catch (err) {
    console.error(err)
  }
}
