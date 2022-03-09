const fs = require('fs')
const formidable = require('formidable')
const aws = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')

const S3_BUCKET = process.env.S3_BUCKET
aws.config.region = process.env.AWS_REGION

const s3 = new aws.S3()

exports.upload_post = async (req, res) => {
  const form = formidable({ multiples: true })
  const fileExtRE = /(?:\.([^.]+))?$/

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err)
      return res.status(500).send(err)
    }

    if (!Array.isArray(files)) files = [files.file]

    let uploaded = []
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        let awsName = `original/${uuidv4()}.${
          fileExtRE.exec(file.originalFilename)[1] || 'png'
        }`
        let awsPath = `https://${S3_BUCKET}.s3.amazonaws.com/${awsName}`

        var params = {
          Body: fs.readFileSync(file.filepath),
          Bucket: S3_BUCKET,
          Key: awsName,
          ACL: 'public-read',
        }

        let data = await s3.upload(params).promise()

        uploaded.push({
          name: awsName,
          path: awsPath,
          type: file.mimetype,
          data,
        })
      }
    } catch (err) {
      console.error(err)
      return res.status(500).send(err)
    }

    return res.send(uploaded)
  })
}

exports.upload_delete = (req, res) => {
  const { filename } = req.params

  var params = {
    Bucket: S3_BUCKET,
    Key: filename,
  }

  s3.deleteObject(params)
    .promise()
    .then(
      function (data) {
        return res.send({ deleted: filename, data })
      },
      function (err) {
        console.error(err)
        return res.status(500).send(err)
      }
    )
}
