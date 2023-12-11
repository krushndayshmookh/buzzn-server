const socketIdMap = {}
const userSocketIdMap = {}

const socketHandler = client => {
  console.info('Client connected.')
  socketIdMap[client.id] = client

  client.on('login', userId => {
    userSocketIdMap[userId] = client.id
  })

  client.on('message', data => {
    const { to, message } = JSON.parse(data)
    const toSocketId = userSocketIdMap[to]
    const toSocket = socketIdMap[toSocketId]

    toSocket.emit('message', message)
  })

  client.on('disconnect', () => {
    console.info('Client disconnected.')
    delete socketIdMap[client.id]
  })
}

module.exports = { socketHandler, socketIdMap, userSocketIdMap }
