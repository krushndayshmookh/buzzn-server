/* eslint-disable no-unused-vars */
const performDatabaseUpdate = require('./performDatabaseUpdate')
const { Holding, Trade, Instrument, Post } = require('../models')
const BLOCK_COUNTS = require('../configs/PostTypeBlockCounts')

async function fixHoldings() {
  /* Holding */
  const holdings = await Holding.find({})
  console.info(`Found ${holdings.length} holdings`)
  for (let i = 0; i < holdings.length; i++) {
    const holding = holdings[i]
    const buyTrades = await Trade.find({
      instrument: holding.instrument,
      buyer: holding.user,
    })
    // const sellTrades = await Trade.find({
    //   instrument: holding.instrument,
    //   seller: holding.user,
    // })
    const buyQuantity = buyTrades.reduce(
      (acc, trade) => acc + trade.quantity,
      0
    )
    // const sellQuantity = sellTrades.reduce(
    //   (acc, trade) => acc + trade.quantity,
    //   0
    // )
    // const quantity = buyQuantity - sellQuantity
    // if (quantity !== holding.quantity) {
    //   console.info(
    //     `Updating holding ${holding._id} from ${holding.quantity} to ${quantity}`
    //   )
    //   holding.quantity = quantity
    //   await holding.save()
    // }
    const buyPrice = buyQuantity
      ? buyTrades.reduce(
          (acc, trade) => acc + trade.price * trade.quantity,
          0
        ) / buyQuantity
      : 0

    if (buyPrice !== holding.averagePrice) {
      console.info(
        `Updating holding ${holding._id} from ${holding.averagePrice} to ${buyPrice}`
      )
      holding.averagePrice = buyPrice
      await holding.save()
    }
    console.info(
      `[${i + 1}/${holdings.length}] Holding ${holding._id} is up to date`
    )
  }
}

async function fixInstruments() {
  /* Instrument */
  const instruments = await Instrument.find({})
  console.info(`Found ${instruments.length} instruments`)
  for (let i = 0; i < instruments.length; i++) {
    const instrument = instruments[i]
    const postsByType = await Post.aggregate([
      {
        $match: {
          user: instrument.user,
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: '$type',
          count: {
            $sum: 1,
          },
        },
      },
    ])
    // console.info(postsByType)
    const generatedShares = postsByType.reduce(
      (acc, post) => acc + BLOCK_COUNTS[post._id] * post.count,
      0
    )
    const holdings = await Holding.find({
      instrument: instrument._id,
    })
    const heldShares = holdings.reduce(
      (acc, holding) => acc + holding.quantity,
      0
    )
    // if (generatedShares && holdings.length) {
    //   console.log({
    //     isOkay: generatedShares >= heldShares,
    //     generatedShares,
    //     holdings: holdings.length,
    //     heldShares,
    //     ...instrument.toObject(),
    //   })
    // }
    instrument.fresh = generatedShares - heldShares
    instrument.floating = heldShares
    instrument.minted = 0
    await instrument.save()
    console.info(
      `[${i + 1}/${instruments.length}] Instrument ${
        instrument._id
      } is up to date`
    )
  }
}

async function cleanHoldings() {
  console.info('Cleaning empty holdings...')
  await Holding.deleteMany({
    quantity: 0,
  })

  console.info('Cleaning holdings due to fresh sell...')
  const holdings = await Holding.find({
    quantity: {
      $lte: 0,
    },
  }).populate('user instrument')
  for (let i = 0; i < holdings.length; i++) {
    const holding = holdings[i]

    if (`${holding.user._id}` === `${holding.instrument.user}`) {
      console.info(
        `Deleting holding ${holding.user.username} ${holding.instrument.symbol}`
      )
      await holding.remove()
    }
  }
}

async function run() {
  await fixHoldings()
  // await cleanHoldings()
  // await fixInstruments()
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
