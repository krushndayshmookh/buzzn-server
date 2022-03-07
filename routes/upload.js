/* eslint-disable new-cap */
/* eslint-disable capitalized-comments */
const router = require('express').Router()

const uploadController = require('../controllers/upload')

// Controllers -----

// router.get('/s3/put/signed', uploadController.s3_signed_put_get)

router.post('/', uploadController.upload_post)

router.delete('/:filename', uploadController.upload_delete)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (upload)')
})

// Export -----
module.exports = router
