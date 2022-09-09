const performDatabaseUpdate = require('../../performDatabaseUpdate')

const { Holding, User, Instrument } = require('../../../models')

async function run() {
  try {
    const user = await User.findOne({ email: 'krushn@dayshmookh.com' })
    const holdings = await Holding.find({ user: user._id }).populate({
      path: 'instrument',
      populate: {
        path: 'user',
      },
    })

    const returnUsernames = [
      'buzznwithyb',
      'kaushalkumar',
      'Tusharjs',
      'Akshat Sharma',
    ]

    for (let i = 0; i < holdings.length; i++) {
      if (returnUsernames.includes(holdings[i].instrument.user.username)) {
        await Instrument.updateOne(
          {
            _id: holdings[i].instrument._id,
          },
          {
            $inc: {
              fresh: holdings[i].quantity,
            },
          }
        )

        holdings[i].quantity = 0
        await holdings[i].save()
      }

      console.info(`${i + 1}/${holdings.length}`)
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
