const router = require('express').Router()

const statisticsController = require('../controllers/statistics')

const validateToken = require('../middlewares/validateToken')

router.get('/users', /* validateToken, */ statisticsController.users_get)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (statistics)')
})

// Export -----
module.exports = router
