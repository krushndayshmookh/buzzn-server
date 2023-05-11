const sendMail = require('./sendMail')

const forgotPasswordTemplate = ({ username, email, token }) => ({
  to: [email],
  subject: 'Reset your Buzzn password',
  html: `
    <h1>Reset your Buzzn password</h1>

    <p>Dear ${username},</p>
    <p>Please click on the link below to reset your password:</p>
    <a href="${process.env.CLIENT_URL}/login/forgot-password?token=${token}" target="_blank" style="display: inline-block; background-color: #3498db; color: #ffffff; text-decoration: none; padding: 10px 20px; font-size: 16px; border-radius: 4px; border: none;">Reset Password</a>

    <br />
    <p>Alternatively, you can copy and paste the following link in your browser:</p>
    <p>${process.env.CLIENT_URL}/login/forgot-password?token=${token}</p>
    <p>This link will expire in 1 hour.</p>
    <br />
    <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>

    <p>Regards,</p>
    <p>Buzzn Support</p>
  `,
  text: `Dear ${username}, please click on the link below to reset your password: ${process.env.CLIENT_URL}/login/forgot-password?token=${token}. Regards, Buzzn Support`,
  from: 'Buzzn Support <support@keepbuzzn.com>',
})

const sendForgotPasswordMail = async ({ username, email, token }) => {
  const emailData = forgotPasswordTemplate({ username, email, token })
  const sesResponse = await sendMail(emailData)
  return sesResponse
}

module.exports = { sendForgotPasswordMail }
