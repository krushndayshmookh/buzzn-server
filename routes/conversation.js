const router = require('express').Router()

const validateToken = require('../middlewares/validateToken')

const conversationController = require('../controllers/conversation')

// Controllers -----

router.get('/', validateToken, conversationController.conversations_get)

router.post('/', validateToken, conversationController.conversations_post)

router.get('/:conversationId/messages', validateToken, conversationController.messages_get)

router.post('/:conversationId/messages', validateToken, conversationController.messages_post)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (conversation)')
})

// Export -----
module.exports = router
