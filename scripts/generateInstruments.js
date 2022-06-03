const performDatabaseUpdate = require('./performDatabaseUpdate')

const { User, Instrument } = require('../models')

async function run() {
  try {
    // fetch users
    const users = await User.find({})

    // set count to 0
    let count = 0

    // loop over each user and check existence of instrument
    for (let user of users) {
      const instrument = await Instrument.findOne({ user: user._id })

      // if not, create instrument
      if (!instrument) {
        const newInstrument = new Instrument({
          user: user._id,
          minted: 0,
          symbol: 'BLOCK-' + user.username,
        })

        await newInstrument.save()

        count++
      }
    }

    console.info(`${count} instruments created`)
    console.info('done')
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
