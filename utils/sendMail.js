/**
 * @description: send mail using aws ses
 *
 * @param {string} to - email address of the recipient
 * @param {string} subject - subject of the email
 * @param {string} html - html content of the email
 * @param {string} text - text content of the email
 * @param {string} from - email address of the sender
 *
 * @returns {object} - response from aws ses
 *
 */

const AWS = require('aws-sdk')

const ses = new AWS.SES({
  region: process.env.AWS_SES_REGION || 'ap-south-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

const sendMail = async ({
  to,
  subject,
  html,
  text,
  from = 'Buzzn DevBot <devbot@keepbuzzn.com>',
}) => {
  const params = {
    Source: from,
    Destination: {
      ToAddresses: to,
    },
    Message: {
      Subject: {
        Data: subject,
      },
      Body: {
        Html: {
          Data: html,
        },
        Text: {
          Data: text,
        },
      },
    },
  }

  try {
    const data = await ses.sendEmail(params).promise()
    return data
  } catch (err) {
    console.error(err)
    throw err
  }
}

module.exports = sendMail
