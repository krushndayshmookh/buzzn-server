const performDatabaseUpdate = require('../../performDatabaseUpdate')

const { User } = require('../../../models')

async function run() {
  try {
    const users = await User.find({})

    for (let i = 0; i < users.length; i++) {
      const user = users[i]

      // user.bonusCash = 1000
      // user.cash = 1000 - user.chips
      user.cash = -user.cash
      // user.chips = null
      await user.save()

      console.info(`${i + 1}/${users.length}`)
    }
    console.info('done')
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
