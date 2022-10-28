const router = require('express').Router()

const reportController = require('../controllers/report')

const validateTokenOptional = require('../middlewares/validateTokenOptional')

router.post('', validateTokenOptional, reportController.report_post)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (report)')
})

// Export -----
module.exports = router
