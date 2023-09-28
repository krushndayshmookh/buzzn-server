const router = require('express').Router()

const validateToken = require('../middlewares/validateToken')

const notificationController = require('../controllers/notification')

// Controllers -----

router.get('/', validateToken, notificationController.notifications_get)

router.put(
  '/:id/markRead',
  validateToken,
  notificationController.notification_markRead_put
)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (notification)')
})

// Export -----
module.exports = router
