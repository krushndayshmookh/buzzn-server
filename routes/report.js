const router = require('express').Router()

const reportController = require('../controllers/report')

const validateToken = require('../middlewares/validateToken')
const validateTokenOptional = require('../middlewares/validateTokenOptional')

router.post('/', validateTokenOptional, reportController.report_post)

router.post('/blocks', validateToken, reportController.block_user_post)

router.get('/blocks', validateToken, reportController.block_user_get)

router.get(
  '/blocks/:userId',
  validateToken,
  reportController.block_user_status_get
)

router.delete(
  '/blocks/:userId',
  validateToken,
  reportController.block_user_unblock_delete
)

router.get('*', (req, res) => {
  res.send('Please read documentation for the API. (report)')
})

// Export -----
module.exports = router
