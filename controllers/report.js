const { Report, Blocklist, Follower } = require('../models')

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

exports.block_user_post = async (req, res) => {
  const { user } = req.decoded
  const { user: userId } = req.body

  try {
    const blocklist = await Blocklist.findOne({
      user: user._id,
      blockedUser: userId,
    })

    if (blocklist) {
      return res.status(400).send({
        error: 'You have already blocked this user',
      })
    }

    const newBlocklist = new Blocklist({
      user: user._id,
      blockedUser: userId,
    })

    await newBlocklist.save()

    await Follower.deleteMany({
      $or: [
        {
          user: user._id,
          follower: userId,
        },
        {
          user: userId,
          follower: user._id,
        },
      ],
    })

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.block_user_get = async (req, res) => {
  const { user } = req.decoded

  try {
    const blocklist = await Blocklist.find({
      user: user._id,
    }).populate([{ path: 'blockedUser', select: 'username avatar isVerified' }])

    return res.send(blocklist)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.block_user_unblock_delete = async (req, res) => {
  const { user } = req.decoded
  const { userId } = req.params

  try {
    const blocklist = await Blocklist.findOne({
      user: user._id,
      blockedUser: userId,
    })

    if (!blocklist) {
      return res.status(400).send({
        error: 'You have not blocked this user',
      })
    }

    await blocklist.remove()

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.block_user_status_get = async (req, res) => {
  const { user } = req.decoded
  const { userId } = req.params

  try {
    const blocklist = await Blocklist.findOne({
      user: user._id,
      blockedUser: userId,
    })

    return res.send({
      blocked: !!blocklist,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
