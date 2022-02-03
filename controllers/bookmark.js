const { Bookmark } = require('../models')

exports.fetch_get = async (req, res) => {
  const { user } = req.decoded
  const { page, limit } = req.query

  let query = {
    user: user._id,
  }

  let options = {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sort: {
      createdAt: -1,
    },
    populate: [
      {
        path: 'user',
        select: 'username avatar',
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
