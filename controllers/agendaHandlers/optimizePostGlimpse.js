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

    console.info('post', post.content.glimpse)

    await fs.ensureDir('/tmp')

    const inVideo = await s3
      .getObject({
        Bucket: S3_BUCKET,
        Key: `${post.content.glimpse.originalFilename}`,
      })
      .createReadStream()

    console.info('Optimizing video')

    const { range } = post.content.glimpse.processing

    // optimize video
    new FfmpegCommand(inVideo)
      .inputFormat('webm')
      .setStartTime(range.start) // Can be in "HH:MM:SS" format also
      .setDuration(range.end - range.start)
      .size('1024x1024')
      .format('webm')
      .audioCodec('copy')
      .videoCodec('copy')
      .on('start', commandLine => {
        console.info(`Spawned FFmpeg with command: ${commandLine}`)
      })
      .on('error', transformError => {
        console.info('error: ', transformError)
      })
      .on('end', async () => {
        console.info('conversion Done')

        const params = {
          Bucket: S3_BUCKET,
          Key: `posts/content/${postId}.webm`,
          Body: fs.createReadStream(`/tmp/${postId}.webm`),
          ContentType: 'video/webm',
          ACL: 'public-read',
        }
        try {
          await s3.putObject(params).promise()
          console.info('uploaded', params.Key)
        } catch (uploadError) {
          console.info('uploadError', uploadError)
        }
      })
      .saveToFile(`/tmp/${postId}.webm`)

    post.content.glimpse.content = `https://cdn.keepbuzzn.com/posts/content/${postId}.webm`

    // generate thumbnail gif
    new FfmpegCommand(inVideo)
      .inputFormat('webm')
      .setStartTime(range.start) // Can be in "HH:MM:SS" format also
      .setDuration(range.end - range.start)
      .size('128x128')
      .format('gif')
      .fps(15)
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

    post.content.glimpse.thumbnail = `https://cdn.keepbuzzn.com/posts/thumbnail/${postId}.gif`

    await post.save()
  } catch (err) {
    console.error(err)
  }
}
