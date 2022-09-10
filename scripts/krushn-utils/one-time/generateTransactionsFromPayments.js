const performDatabaseUpdate = require('../../performDatabaseUpdate')

const { Payment, Transaction } = require('../../../models')

async function run() {
  try {
    const payments = await Payment.find({})

    // const transactions = payments.map(payment => {
    //   const transaction = new Transaction({
    //     amount: payment.price,
    //     user: payment.user,
    //     payment: payment._id,
    //     type: 'payment',
    //   })

    //   return transaction
    // })

    // const result = await Transaction.insertMany(transactions)
    // console.info('done', result)

    for (let i = 0; i < payments.length; i++) {
      const payment = payments[i]
      Transaction.updateOne(
        {
          payment: payment._id,
        },
        {
          $set: {
            amount: payment.price * payment.quantity,
          },
        }
      )

      console.info(
        `[${i + 1}/${payments.length}]`,
        'Updated transaction for payment',
        payment._id
      )
    }
  } catch (err) {
    console.error(err)
  }
}

const main = async () => {
  await performDatabaseUpdate(run)
}

main()
