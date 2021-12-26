const router = require('express').Router()

const postController = require('../controllers/post')

router.post('/', postController.create_post)

router.get('/', (req, res) => {
  res.send('Please read documentation for the API. (user)')
})

// Export -----
module.exports = router
