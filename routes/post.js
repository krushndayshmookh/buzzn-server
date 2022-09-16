const router = require('express').Router()

const postController = require('../controllers/post')

const validateToken = require('../middlewares/validateToken')
const validateTokenOptional = require('../middlewares/validateTokenOptional')

router.post('/', validateToken, postController.create_post)

router.get('/', postController.fetch_get)

router.get('/:postId', validateTokenOptional, postController.fetch_single_get)

router.post('/:postId/comments', validateToken, postController.comments_post)

router.get('/:postId/comments', validateToken, postController.comments_get)

router.get('/:postId/comments/:commentId', validateToken, postController.comment_single_get)

router.put('/:postId/likes', validateToken, postController.like_put)

router.get('/:postId/likes/count', postController.likesCount_get)

router.get(
  '/:postId/likes/hasLiked',
  validateToken,
  postController.hasLiked_get
)

router.get('/:postId/likes/:likeId', postController.like_single_get)

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

router.delete('/:postId', validateTokenOptional, postController.delete_single_get)


router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (post)')
})

// Export -----
module.exports = router
