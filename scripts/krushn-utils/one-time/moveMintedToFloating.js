const performDatabaseUpdate = require('../../performDatabaseUpdate')

const { Instrument } = require('../../../models')

async function run() {
  try {
    const instruments = await Instrument.find({})

    for (let i = 0; i < instruments.length; i++) {
      const instrument = instruments[i]

      instrument.fresh += instrument.minted
      instrument.minted = 0

      await instrument.save()

      console.info(`${i + 1}/${instruments.length}`)
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
