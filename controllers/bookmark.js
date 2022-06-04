const { Bookmark } = require('../models')

exports.fetch_get = async (req, res) => {
  const { user } = req.decoded
  const { page, limit } = req.query

  const query = {
    user: user._id,
  }

  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    sort: {
      createdAt: -1,
    },
    populate: [
      {
        path: 'user',
        select: 'username avatar isVerified',
      },
      {
        path: 'post',
      },
    ],
  }

  try {
    const posts = await Bookmark.paginate(query, options)
    return res.send(posts)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
