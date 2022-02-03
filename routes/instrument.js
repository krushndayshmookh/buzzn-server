const router = require('express').Router()

const validateToken = require('../middlewares/validateToken')

const instrumentController = require('../controllers/instrument')

// Controllers -----

router.get('/', validateToken, instrumentController.instruments_list_get)

router.post('/float', validateToken, instrumentController.blocks_float_post)

router.get('/:instrumentId', validateToken, instrumentController.instrument_get)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (instrument)')
})

// Export -----
module.exports = router
