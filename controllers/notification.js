const { Notification } = require('../models')

exports.notifications_get = async (req, res) => {
  const { user } = req.decoded
  const { page, limit } = req.query

  const query = {
    user: user._id,
  }

  const sort = {
    createdAt: -1,
  }

  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    sort,
  }

  try {
    let notifications = []
    if (page) {
      notifications = await Notification.paginate(query, options)
    } else {
      notifications = await Notification.find(query).sort(sort)
    }
    return res.send(notifications)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.notification_markRead_put = async (req, res) => {
  const { user } = req.decoded
  const { id } = req.params

  try {
    const notification = await Notification.findOne({
      _id: id,
      user: user._id,
    })

    if (!notification) {
      return res.status(404).send({ err: 'Notification not found' })
    }

    notification.read = true
    await notification.save()

    return res.send(notification)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
