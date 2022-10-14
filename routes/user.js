const router = require('express').Router()

const validateToken = require('../middlewares/validateToken')

const userController = require('../controllers/user')

// Controllers -----

router.post('/messaging-tokens', validateToken, userController.user_messagingToken_post)

router.post('/verify', validateToken, userController.user_verify_post)

router.get('/profile', validateToken, userController.profile_get)

router.get('/watchlist', validateToken, userController.user_watchlist_get)

router.get(
  '/watchlist/isWatching',
  validateToken,
  userController.user_isWatching_get
)

router.post('/watchlist', validateToken, userController.user_watchlist_post)

router.delete(
  '/watchlist/:instrumentId',
  validateToken,
  userController.user_watchlist_delete
)

router.get(
  '/by-username/:username',
  validateToken,
  userController.byUsername_get
)

router.get('/:userId', validateToken, userController.details_get)

router.get('/:userId/instrument', userController.user_instrument_get)

router.get('/:username/followers', userController.followers_get)

router.get('/:username/following', userController.following_get)

router.get(
  '/:userId/followers/isFollowing',
  validateToken,
  userController.isFollowing_get
)

router.put('/:userId/followers', validateToken, userController.follower_put)

router.get(
  '/:username/followers/:followerId',
  userController.follower_single_get
)

router.delete(
  '/:userId/followers',
  validateToken,
  userController.follower_delete
)

router.get('/', validateToken, userController.list_get)

router.post('/', validateToken, userController.create_post)

router.put('/', validateToken, userController.update_put)

router.delete('/:userId', validateToken, userController.delete_delete)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (user)')
})

// Export -----
module.exports = router
