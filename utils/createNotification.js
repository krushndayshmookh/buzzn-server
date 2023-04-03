const { Notification, MessagingToken } = require('../models')
const firebaseAdmin = require('../init-firebase')

const createNotification = async (user, trigger, data, message) => {
  const notification = new Notification({
    user,
    message,
    data,
    trigger,
  })
  await notification.save()

  // generate FCM notification
  let tokens = await MessagingToken.find({ user })

  const notificationPayload = {
    notification: {
      title: 'Buzzn',
      body: message || 'New notification',
    },
    data: {
      type: 'notification',
      id: notification._id.toString(),
    },
  }

  if (tokens.length) {
    tokens = tokens.map(token => token.token)
    await firebaseAdmin.messaging().sendToDevice(tokens, notificationPayload)
  }

  return notification
}

module.exports = createNotification
