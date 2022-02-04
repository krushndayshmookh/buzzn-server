const router = require('express').Router()

const orderController = require('../controllers/order')

const validateToken = require('../middlewares/validateToken')

router.post('/', validateToken, orderController.placeOrder_post)

router.get('/', validateToken, orderController.fetchOrders_get)

router.delete('/:orderId', validateToken, orderController.cancelOrder_delete)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (order)')
})

// Export -----
module.exports = router
