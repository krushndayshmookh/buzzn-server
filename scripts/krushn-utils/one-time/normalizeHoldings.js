const performDatabaseUpdate = require('../../performDatabaseUpdate')

const { Holding } = require('../../../models')

async function run() {
  try {
    const holdings = await Holding.find({}).populate('instrument')

    for (let i = 0; i < holdings.length; i++) {
      const holding = holdings[i]
      holding.averagePrice = holding.instrument.ltp
      await holding.save()

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
