const router = require('express').Router()

const postController = require('../controllers/post')

const validateToken = require('../middlewares/validateToken')

router.post('/', validateToken, postController.create_post)

router.get('/', postController.fetch_get)

router.put('/:postId/likes', validateToken, postController.like_put)

router.get('/:postId/likes/count', postController.likesCount_get)

router.get(
  '/:postId/likes/hasLiked',
  validateToken,
  postController.hasLiked_get
)

router.delete('/:postId/likes', validateToken, postController.like_delete)

router.put('/:postId/bookmarks', validateToken, postController.bookmark_put)

router.get(
  '/:postId/bookmarks/hasBookmarked',
  validateToken,
  postController.hasBookmarked_get
)

router.delete(
  '/:postId/bookmarks',
  validateToken,
  postController.bookmark_delete
)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (user)')
})

// Export -----
module.exports = router
