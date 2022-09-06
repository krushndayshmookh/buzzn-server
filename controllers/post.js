const axios = require('axios')

const {
  Post,
  Instrument,
  BlockDelta,
  Like,
  Bookmark,
  Comment,
  Holding,
} = require('../models')

const BLOCK_COUNTS = require('../configs/PostTypeBlockCounts')

const { PROCESSING_SERVER_URL } = process.env

exports.fetch_get = async (req, res) => {
  const { page, limit, user, type, fetchStart } = req.query

  const query = {
    isDeleted: false,
  }

  if (fetchStart) {
    query.createdAt = {
      $lte: fetchStart,
    }
  }

  if (type) {
    query.type = type
  }

  if (user) {
    query.user = user
  }

  const sort = {
    createdAt: -1,
  }

  // const populate = [
  //   {
  //     path: 'user',
  //     select: 'username avatar isVerified',
  //   },
  //   {
  //     path: 'likesCount',
  //   },
  //   {
  //     path: 'commentsCount',
  //   },
  // ]

  const select = '_id'

  try {
    let posts = []

    if (page && limit) {
      posts = await Post.paginate(query, {
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 100,
        sort,
        // populate,
        select,
      })
    } else {
      posts = await Post.find(query).select(select).sort(sort) // .populate(populate)
    }
    return res.send(posts)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.fetch_single_get = async (req, res) => {
  const { postId } = req.params

  const loggedUser = req.decoded?.user || null

  const query = {
    _id: postId,
    isDeleted: false,
  }

  const populate = [
    {
      path: 'user',
      select: 'username avatar isVerified',
    },
    {
      path: 'likesCount',
    },
    {
      path: 'commentsCount',
    },
  ]

  try {
    const post = await Post.findOne(query)
      .populate(populate)
      .lean({ virtuals: true })

    if (!post) {
      return res.status(404).send({
        error: 'Post not found',
      })
    }

    if (post.requireMinShares > 0) {
      if (!loggedUser) {
        delete post.content
      }

      if (loggedUser && `${post.user._id}` !== loggedUser._id) {
        const instrument = await Instrument.findOne({
          user: post.user._id,
        })

        const holding = await Holding.findOne({
          user: loggedUser._id,
          instrument: instrument._id,
        })

        if (!holding || holding.quantity < post.requireMinShares) {
          delete post.content
        }
      }
    }

    return res.send(post)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.create_post = async (req, res) => {
  const { type, content } = req.body
  let { requireMinShares } = req.body

  requireMinShares = parseInt(requireMinShares, 10)

  const { user } = req.decoded

  const blockCount = BLOCK_COUNTS[type]

  try {
    const newPost = new Post({
      user: user._id,
      type,
      content,
      requireMinShares,
    })

    await newPost.save()

    let instrument = await Instrument.findOne({ user: user._id })

    if (instrument) {
      instrument.minted += blockCount
    } else {
      instrument = new Instrument({
        user: user._id,
        minted: blockCount,
        symbol: `BLOCK-${user.username}`,
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

    if (newPost.type === 'image') {
      await axios
        .post(`${PROCESSING_SERVER_URL}/api/process/post/image`, {
          post: newPost._id,
        })
        .catch(console.error)
    }

    if (newPost.type === 'audio') {
      await axios
        .post(`${PROCESSING_SERVER_URL}/api/process/post/audio`, {
          post: newPost._id,
        })
        .catch(console.error)
    }

    return res.status(201).send({ success: true })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.like_put = async (req, res) => {
  const { postId } = req.params
  const { user } = req.decoded

  try {
    const post = await Post.findById(postId)

    if (!post) {
      return res.status(404).send({
        error: 'Post not found',
      })
    }

    const like = await Like.findOne({
      user: user._id,
      post: postId,
    })

    if (like) {
      return res.status(400).send({
        error: 'You have already liked this post',
      })
    }

    const newLike = new Like({
      user: user._id,
      post: postId,
    })

    await newLike.save()

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.likesCount_get = async (req, res) => {
  const { postId } = req.params

  try {
    const likesCount = await Like.countDocuments({
      post: postId,
    })

    return res.send({ likesCount })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.hasLiked_get = async (req, res) => {
  const { user } = req.decoded
  const { postId } = req.params

  try {
    const userLike = await Like.findOne({
      post: postId,
      user: user._id,
    })

    const hasLiked = !!userLike
    return res.send({ hasLiked })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.like_delete = async (req, res) => {
  const { postId } = req.params
  const { user } = req.decoded

  try {
    const like = await Like.findOne({
      user: user._id,
      post: postId,
    })

    if (!like) {
      return res.status(404).send({
        error: 'Like not found',
      })
    }

    await like.remove()

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.bookmark_put = async (req, res) => {
  const { postId } = req.params
  const { user } = req.decoded

  try {
    const post = await Post.findById(postId)

    if (!post) {
      return res.status(404).send({
        error: 'Post not found',
      })
    }

    const bookmark = await Bookmark.findOne({
      user: user._id,
      post: postId,
    })

    if (bookmark) {
      return res.status(400).send({
        error: 'You have already bookmarked this post',
      })
    }

    const newBookmark = new Bookmark({
      user: user._id,
      post: postId,
    })

    await newBookmark.save()

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.hasBookmarked_get = async (req, res) => {
  const { user } = req.decoded
  const { postId } = req.params

  try {
    const userBookmark = await Bookmark.findOne({
      post: postId,
      user: user._id,
    })

    const hasBookmarked = !!userBookmark
    return res.send({ hasBookmarked })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.bookmark_delete = async (req, res) => {
  const { postId } = req.params
  const { user } = req.decoded

  try {
    const bookmark = await Bookmark.findOne({
      user: user._id,
      post: postId,
    })

    if (!bookmark) {
      return res.status(404).send({
        error: 'Bookmark not found',
      })
    }

    await bookmark.remove()

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.comments_post = async (req, res) => {
  const { postId } = req.params
  const { user } = req.decoded
  const { comment } = req.body

  try {
    const post = await Post.findById(postId)

    if (!post) {
      return res.status(404).send({
        error: 'Post not found',
      })
    }

    const newComment = new Comment({
      user: user._id,
      post: postId,
      content: comment,
    })

    await newComment.save()

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.comments_get = async (req, res) => {
  const { postId } = req.params

  try {
    const post = await Post.findById(postId)

    if (!post) {
      return res.status(404).send({
        error: 'Post not found',
      })
    }

    const populate = [
      {
        path: 'user',
        select: 'username avatar isVerified',
      },
    ]

    const comments = await Comment.find({
      post: postId,
    })
      .populate(populate)
      .sort({ createdAt: -1 })

    return res.send(comments)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
