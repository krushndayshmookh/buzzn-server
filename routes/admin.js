const router = require('express').Router()

const adminController = require('../controllers/admin')

// Controllers -----

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (admin)')
})

// Export -----
module.exports = router
