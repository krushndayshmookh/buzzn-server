const fs = require('fs-extra')
const formidable = require('formidable')
const aws = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')

const { S3_BUCKET } = process.env
aws.config.region = process.env.AWS_REGION

const s3 = new aws.S3()

exports.upload_post = async (req, res) => {
  const form = formidable({ multiples: true })
  const fileExtRE = /(?:\.([^.]+))?$/

  form.parse(req, async (err, fields, incomingFiles) => {
    if (err) {
      console.error(err)
      return res.status(500).send(err)
    }

    let files

    if (!Array.isArray(incomingFiles.file)) {
      files = [incomingFiles.file]
    } else {
      files = incomingFiles.file
    }

    // console.log(files)

    const uploaded = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        const awsName = `original/${uuidv4()}.${
          fileExtRE.exec(file.originalFilename)[1] || 'png'
        }`
        let awsPath = `https://${S3_BUCKET}.s3.amazonaws.com/${awsName}`

        const params = {
          Body: fs.readFileSync(file.filepath),
          Bucket: S3_BUCKET,
          Key: awsName,
          ACL: 'public-read',
        }

        let data

        if (process.env.NODE_ENV !== 'development') {
          data = await s3.upload(params).promise()
        } else {
          awsPath = `/uploads/${awsName}`

          await fs.ensureDirSync(`${__dirname}/../public/uploads/original`)
          await fs.copyFileSync(
            file.filepath,
            `${__dirname}/../public${awsPath}`
          )
          awsPath = `http://localhost:3000${awsPath}`
        }

        uploaded.push({
          name: awsName,
          path: awsPath,
          type: file.mimetype,
          data,
        })
      }
    } catch (uploadErr) {
      console.error(uploadErr)
      return res.status(500).send(uploadErr)
    }

    return res.send(uploaded)
  })
}

exports.upload_delete = (req, res) => {
  const { filename } = req.params

  const params = {
    Bucket: S3_BUCKET,
    Key: filename,
  }

  s3.deleteObject(params)
    .promise()
    .then(
      data => res.send({ deleted: filename, data }),
      err => {
        console.error(err)
        return res.status(500).send(err)
      }
    )
}

// eslint-disable-next-line consistent-return
exports.upload_signedURL_get = (req, res) => {
  const { type } = req.query
  const { user } = req.decoded

  if (!type) {
    return res.status(400).send('Missing type')
  }

  const params = {
    Bucket: S3_BUCKET,
    Expires: 300,
    ACL: 'public-read',
  }

  switch (type) {
    case 'put-glimpse-original':
      params.Key = `original/${uuidv4()}.webm`
      params.ContentType = 'video/webm'
      break

    case 'put-verification-selfie':
      params.Key = `verification/selfie/${user._id}.png`
      params.ContentType = 'image/png'
      break

    case 'put-verification-pan':
      params.Key = `verification/pan/${user._id}.png`
      params.ContentType = 'image/png'
      break

    default:
      return res.status(400).send('Invalid type')
  }

  s3.getSignedUrl('putObject', params, (err, url) => {
    if (err) {
      console.error(err)
      return res.status(500).send(err)
    }

    return res.send({
      url,
      key: params.Key,
      path: `https://${S3_BUCKET}.s3.amazonaws.com/${params.Key}`,
      filename: params.Key.split('/').pop(),
    })
  })
}
