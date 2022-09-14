const { Notification } = require('../models')

const createNotification = async (user, trigger, data, message) => {
  const notification = new Notification({
    user,
    message,
    data,
    trigger,
  })
  await notification.save()
  return notification
}

module.exports = createNotification
