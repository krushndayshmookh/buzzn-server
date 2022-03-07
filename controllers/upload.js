const fs = require('fs')
const formidable = require('formidable')
const aws = require('aws-sdk')
const { v4: uuidv4 } = require('uuid')

const asyncForEach = require('../utils/asyncForEach')

const S3_BUCKET = process.env.S3_BUCKET
aws.config.region = process.env.AWS_REGION

const s3 = new aws.S3()

// exports.s3_signed_put_get = (req, res) => {
//   const fileName = req.query.fileName
//   const fileType = req.query.fileType
//
//   const s3Params = {
//     Bucket: S3_BUCKET,
//     Key: fileName,
//     Expires: 60,
//     ContentType: fileType,
//     ACL: 'public-read'
//   }
//
//   s3.getSignedUrl('putObject', s3Params, (err, data) => {
//     if (err) {
//       console.error(err)
//       return res.status(500).send(err)
//     }
//     const returnData = {
//       signedRequest: data,
//       url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
//     }
//     res.send(JSON.stringify(returnData))
//   })
// }

exports.upload_post = async (req, res) => {
  const form = formidable({ multiples: true })
  const fileExtRE = /(?:\.([^.]+))?$/

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err)
      return res.status(500).send(err)
    }

    if (!Array.isArray(files.media)) files.media = [files.media]

    asyncForEach(files.media, async file => {
      awsName = uuidv4() + '.' + (fileExtRE.exec(file.name)[1] || 'png')
      awsPath = `https://${S3_BUCKET}.s3.amazonaws.com/${awsName}`

      var params = {
        Body: fs.readFileSync(file.path),
        Bucket: S3_BUCKET,
        Key: awsName,
        ACL: 'public-read',
      }

      await s3
        .putObject(params)
        .promise()
        .then(
          function (data) {
            // console.info(data)
          },
          function (error) {
            console.error(error)
          }
        )
      return { name: awsName, path: awsPath, type: file.type }
    }).then(result => {
      return res.json(result)
    })
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
        return res.send({ deleted: filename })
      },
      function (err) {
        console.error(err)
        return res.status(500).send(err)
      }
    )
}
