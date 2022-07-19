const router = require('express').Router()

const adminController = require('../controllers/admin')

// Controllers -----

router.get('/users', adminController.users_get)

router.put('/users/:userId', adminController.users_put)

router.get('/stats/users', adminController.stats_users_get)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (admin)')
})

// Export -----
module.exports = router
