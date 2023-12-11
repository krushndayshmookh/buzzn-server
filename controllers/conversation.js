const { Conversation, Message } = require('../models')

const { io } = global
const { socketIdMap, userSocketIdMap } = require('../handlers/index')

exports.conversations_get = async (req, res) => {
  const { _id } = req.decoded.user

  try {
    const conversations = await Conversation.find({ users: _id })
      .populate({
        path: 'users',
        select: '-password',
      })
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: '-password',
        },
      })
      // .sort({ updatedAt: -1 })
      .lean()

    // sort by last message
    conversations.sort((a, b) => {
      if (!a.lastMessage) {
        return 1
      }

      if (!b.lastMessage) {
        return -1
      }

      return b.lastMessage.createdAt - a.lastMessage.createdAt
    })

    return res.send(conversations)
  } catch (err) {
    console.error(err)
    return res.status(500).send({ err })
  }
}

exports.conversations_post = async (req, res) => {
  const { _id } = req.decoded.user
  const { users, type, title } = req.body

  try {
    const conversation = new Conversation({
      users: [...users, _id],
      type: type || 'private',
      title: title || null,
    })

    await conversation.save()

    return res.status(201).send(conversation)
  } catch (err) {
    console.error(err)
    return res.status(500).send({ err })
  }
}

exports.messages_get = async (req, res) => {
  const { conversationId } = req.params
  const { page } = req.query

  try {
    const data = await Message.paginate(
      {
        conversation: conversationId,
      },
      {
        page: parseInt(page, 10) || 1,
        limit: 10,
        sort: { createdAt: -1 },
        populate: {
          path: 'sender',
          select: '-password',
        },
      }
    )

    // sort

    return res.send(data)
  } catch (err) {
    console.error(err)
    return res.status(500).send({ err })
  }
}

exports.messages_post = async (req, res) => {
  const { _id } = req.decoded.user
  const { conversationId } = req.params
  const { content } = req.body

  try {
    const message = new Message({
      sender: _id,
      conversation: conversationId,
      content,
    })

    await message.save()

    const conversation = await Conversation.findOne(
      { _id: conversationId },
      'users'
    ).lean()
    const members = conversation.users
      .map(u => u.toString())
      .filter(user => user !== _id)

    members.forEach(member => {
      const socketId = userSocketIdMap[member]
      if (socketId) {
        io.to(socketId).emit('new-message', message)
      }
    })

    return res.status(201).send(message)
  } catch (err) {
    console.error(err)
    return res.status(500).send({ err })
  }
}
