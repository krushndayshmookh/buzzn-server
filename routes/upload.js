/* eslint-disable new-cap */
/* eslint-disable capitalized-comments */
const router = require('express').Router()

const uploadController = require('../controllers/upload')

const validateToken = require('../middlewares/validateToken')

// Controllers -----
router.get('/signed-url', validateToken, uploadController.upload_signedURL_get)

router.post('/', uploadController.upload_post)

router.delete('/:filename', uploadController.upload_delete)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (upload)')
})

// Export -----
module.exports = router
