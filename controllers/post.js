const axios = require('axios')

const {
  Post,
  Instrument,
  BlockDelta,
  Like,
  Bookmark,
  Comment,
  Holding,
  Follower,
  User,
  Blocklist,
} = require('../models')

const createNotification = require('../utils/createNotification')

const BLOCK_COUNTS = require('../configs/PostTypeBlockCounts')

const { PROCESSING_SERVER_URL } = process.env

exports.fetch_get = async (req, res) => {
  const { page, limit, user, type, fetchStart } = req.query

  const { decoded } = req

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
  } else if (decoded?.user) {
    query.user = {}
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
    // exclude blocked users
    if (decoded?.user) {
      const blockedUsers = await Blocklist.find({
        $or: [{ user: decoded.user._id }, { blockedUser: decoded.user._id }],
      })

      const blockedUserIds = blockedUsers.map(u => {
        if (u.user.toString() === decoded.user._id.toString()) {
          return u.blockedUser
        }
        return u.user
      })

      query.user.$nin = blockedUserIds
    }

    // show posts from users whom you follow
    if (!user && decoded?.user) {
      let following = await Follower.find({ follower: decoded.user._id })
        .select('user')
        .lean()

      if (following.length > 0) {
        following = following.map(f => f.user)

        query.user.$in = following

        query.user.$in.push(decoded.user._id)
      }
    }

    let posts = []

    console.log('Post Query:', JSON.stringify(query, null, 2))

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

  if (type === 'glimpse') {
    content.glimpse.processing.status = 'pending'
  }

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
      // instrument.minted += blockCount
      instrument.fresh += blockCount
    } else {
      instrument = new Instrument({
        user: user._id,
        // minted: blockCount,
        fresh: blockCount,
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

    await axios
      .post(`${PROCESSING_SERVER_URL}/process/post/${type}`, {
        post: newPost._id,
      })
      .catch(console.error)

    const mentions = []

    const regex = /@([a-zA-Z0-9_]+)/g

    if (content?.text) {
      let match = regex.exec(content.text)
      while (match != null) {
        mentions.push(match[1])
        match = regex.exec(content.text)
      }
    } else if (content.audio) {
      let match = regex.exec(content.title)
      while (match != null) {
        mentions.push(match[1])
        match = regex.exec(content.title)
      }
    } else {
      let match = regex.exec(content[type].caption)
      while (match != null) {
        mentions.push(match[1])
        match = regex.exec(content[type].caption)
      }
    }

    if (mentions.length > 0) {
      const users = await User.find({ username: { $in: mentions } }).select(
        '_id'
      )

      const notificationPromises = users.map(mentionedUser =>
        createNotification(mentionedUser, 'mention', {
          post: newPost._id,
          user: user._id,
        })
      )

      await Promise.all(notificationPromises)
    }

    return res.status(201).send(newPost)
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

    await createNotification(post.user, 'like', {
      post: postId,
      user: user._id,
      like: newLike._id,
    })

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

    await createNotification(post.user, 'comment', {
      post: postId,
      user: user._id,
      comment: newComment._id,
    })

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

exports.like_single_get = async (req, res) => {
  const { likeId } = req.params

  try {
    const like = await Like.findById(likeId).populate([
      {
        path: 'user',
        select: 'username avatar isVerified',
      },
      {
        path: 'post',
      },
    ])

    if (!like) {
      return res.status(404).send({
        error: 'Like not found',
      })
    }

    return res.send(like)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.comment_single_get = async (req, res) => {
  const { commentId } = req.params

  try {
    const comment = await Comment.findById(commentId).populate([
      {
        path: 'user',
        select: 'username avatar isVerified',
      },
      {
        path: 'post',
      },
    ])

    if (!comment) {
      return res.status(404).send({
        error: 'Comment not found',
      })
    }

    return res.send(comment)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.delete_single_delete = async (req, res) => {
  const { postId } = req.params

  try {
    const post = await Post.findById(postId)

    if (!post) {
      return res.status(404).send({
        error: 'Post not found',
      })
    }

    post.isDeleted = true
    await post.save()

    return res.send({
      success: true,
    })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
