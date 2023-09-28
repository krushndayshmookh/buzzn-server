const performDatabaseUpdate = require('../../performDatabaseUpdate')

const { Notification, Like, Comment, Follower } = require('../../../models')

async function run() {
  try {
    await Notification.deleteMany({})
    console.info('Deleted all notifications')

    const likes = await Like.find({}).populate('post')
    console.info(`Found ${likes.length} likes`)

    const comments = await Comment.find({}).populate('post')
    console.info(`Found ${comments.length} comments`)

    const followers = await Follower.find({})
    console.info(`Found ${followers.length} followers`)

    const likeNotifications = likes.map(like => {
      if (like.post && like.post.user) {
        const notification = new Notification({
          user: like.post.user,
          trigger: 'like',
          data: {
            post: like.post._id,
            user: like.user,
            like: like._id,
          },
          createdAt: like.createdAt,
        })
        return notification
      }
      return null
    })

    const commentNotifications = comments.map(comment => {
      if (comment.post && comment.post.user) {
        const notification = new Notification({
          user: comment.post.user,
          trigger: 'comment',
          data: {
            post: comment.post._id,
            user: comment.user,
            comment: comment._id,
          },
          createdAt: comment.createdAt,
        })
        return notification
      }
      return null
    })

    const followerNotifications = followers.map(follower => {
      const notification = new Notification({
        user: follower.user,
        trigger: 'follow',
        data: {
          user: follower.follower,
          follower: follower._id,
        },
        createdAt: follower.createdAt,
      })
      return notification
    })

    const notifications = [
      ...likeNotifications,
      ...commentNotifications,
      ...followerNotifications,
    ]

    // cleanup null
    const filteredNotifications = notifications.filter(
      notification => notification !== null
    )

    await Notification.insertMany(filteredNotifications)

    console.info(
      `Successfully created ${filteredNotifications.length} notifications`
    )
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
