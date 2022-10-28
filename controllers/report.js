const { Report } = require('../models')

exports.report_post = async (req, res) => {
  const user = req.decoded?.user
  const {
    reason = 'spam',
    type = 'post',
    post: postId,
    user: userId,
  } = req.body

  try {
    const contentId = type === 'post' ? postId : userId

    if (user) {
      const report = await Report.findOne({
        reporter: user._id,
        [type]: contentId,
      })

      if (report) {
        return res.status(400).send({
          error: `You have already reported this ${type}`,
        })
      }
    }

    const newReport = new Report({
      reporter: user?._id,
      [type]: contentId,
      reason,
    })

    await newReport.save()

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
