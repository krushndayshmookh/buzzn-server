const { Post, Instrument, BlockDelta, Like, Bookmark } = require('../models')

const BLOCK_COUNTS = require('../configs/PostTypeBlockCounts')

exports.fetch_get = async (req, res) => {
  const { page, limit } = req.query
  const { type } = req.query

  let query = {}

  if (type) {
    query.type = type
  }

  try {
    const posts = await Post.paginate(query, {
      page: parseInt(page, 10) || 1,
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
    })
    return res.send(posts)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.create_post = async (req, res) => {
  const { type, text, image_url, caption } = req.body
  const { user } = req.decoded

  const blockCount = BLOCK_COUNTS[type]

  try {
    const newPost = new Post({
      user: user._id,
      type,
      text,
      content: {
        text: {
          content: text,
          color: '#BBD686',
        },

        image: {
          content: image_url,
          caption: caption,
        },
      },
    })

    await newPost.save()

    let instrument = await Instrument.findOne({ user: user._id })

    if (instrument) {
      instrument.minted += blockCount
    } else {
      instrument = new Instrument({
        user: user._id,
        minted: blockCount,
        symbol: 'BLOCK-' + user.username,
      })
    }
    await instrument.save()

    const blockDelta = new BlockDelta({
      user: user._id,
      instrument: instrument._id,
      type: 'mint',
      quantity: blockCount,
      data: {
        post: newPost._id,
      },
    })

    await blockDelta.save()

    return res.status(201).send({ success: true })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
