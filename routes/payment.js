const router = require('express').Router()

const paymentController = require('../controllers/payment')

const validateToken = require('../middlewares/validateToken')

router.post('/checkout', validateToken, paymentController.checkout_post)

router.post('/validate', validateToken, paymentController.validate_post)

router.get('/transactions', validateToken, paymentController.transactions_get)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (payment)')
})

// Export -----
module.exports = router
