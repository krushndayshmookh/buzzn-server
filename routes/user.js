const router = require('express').Router()

const validateToken = require('../middlewares/validateToken')

const userController = require('../controllers/user')

// Controllers -----

router.get('/:userId', validateToken, userController.details_get)

router.get('/:userId/followers', userController.followers_get)

router.get(
  '/:userId/followers/isFollowing',
  validateToken,
  userController.isFollowing_get
)

router.put('/:userId/followers', validateToken, userController.follower_put)

router.delete(
  '/:userId/followers',
  validateToken,
  userController.follower_delete
)

router.get('/', validateToken, userController.list_get)

router.post('/', validateToken, userController.create_post)

router.delete('/:userId', validateToken, userController.delete_delete)

router.get('/', (req, res) => {
  res.send('Please read documentation for the API. (user)')
})

// Export -----
module.exports = router
