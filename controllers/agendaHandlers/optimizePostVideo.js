const aws = require('aws-sdk')
const fs = require('fs-extra')

const FfmpegCommand = require('fluent-ffmpeg')

const { S3_BUCKET } = process.env
aws.config.region = process.env.AWS_REGION

const s3 = new aws.S3()

module.exports = async job => {
  const videoData = job?.attrs?.data
  const { path, chunks } = videoData

  console.info('Optimizing video', path)
  console.info('Chunks', chunks.length)

  try {
    let command = new FfmpegCommand()

    fs.ensureDirSync('/tmp/videos')
    fs.ensureDirSync('/tmp/merger')

    // const outputStream = fs.createWriteStream('/tmp' + path)

    for (let i = 0; i < chunks.length; i++) {
      command = command.addInput(chunks[i].filepath).inputFormat('webm')
    }

    command
      // .size('640x640')
      // .autopad('white')
      // .fps(30)
      .format('mp4')
      // .output(outputStream, { end: true })
      .on('error', err => {
        console.info(err)
      })
      .on('end', async () => {
        console.info('rendered')

        const params = {
          Bucket: S3_BUCKET,
          Key: path,
          Body: fs.createReadStream(`/tmp${path}`),
          ContentType: 'video/mp4',
          ACL: 'public-read',
        }

        try {
          await s3.putObject(params).promise()
          console.info('uploaded', path)
        } catch (err) {
          console.info('uploadError', err)
        }
      })

      // .run()
      .mergeToFile(`/tmp${path}`, '/tmp/merger')
  } catch (err) {
    console.error(err)
  }
}
