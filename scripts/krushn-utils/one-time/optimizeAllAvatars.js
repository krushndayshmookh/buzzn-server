const axios = require('axios')
const performDatabaseUpdate = require('../../performDatabaseUpdate')

const { User } = require('../../../models')

async function run() {
  try {
    const users = await User.find()

    console.info(`Found ${users.length} users.`)

    for (let i = 0; i < users.length; i++) {
      setTimeout(async () => {
        const user = users[i]
        try {
          await axios.post(
            'https://processing.keepbuzzn.com/process/user/avatar',
            {
              user: user._id,
            }
          )
        } catch (err) {
          console.error('Error processing user', user._id)
        }

        console.info(`Queued ${i + 1}/${users.length}`)
      }, 100 * i)
    }
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
