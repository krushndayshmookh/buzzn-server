const router = require('express').Router()

const validateToken = require('../middlewares/validateToken')

const holdingController = require('../controllers/holding')

// Controllers -----

router.get('/', validateToken, holdingController.holdings_get)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (holding)')
})

// Export -----
module.exports = router
