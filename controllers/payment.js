const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const { Payment, User, Transaction } = require('../models')

const CHIP_PRICE = require('../configs/chipPrice')

exports.checkout_post = async (req, res) => {
  const { user } = req.decoded
  let { quantity } = req.body

  quantity = parseFloat(quantity)
  const price = CHIP_PRICE.INR

  try {
    const savedUser = await User.findOne({ _id: user._id })

    if (!savedUser.customer) {
      const customer = await stripe.customers.create({
        email: savedUser.email,
        name: `${savedUser.firstName} ${savedUser.lastName}`,
        phone: savedUser.phone,
      })
      savedUser.customer = customer.id
      await savedUser.save()
    }

    const priceInPaise = price * 100
    const amount = priceInPaise * quantity

    const payment = new Payment({
      user: user._id,
      quantity,
      price,
      currency: 'INR',
      status: 'pending',
      customer: user.customer,
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'inr',
      automatic_payment_methods: { enabled: true },
    })

    payment.paymentIntent = paymentIntent.id

    await payment.save()

    return res.json({ client_secret: paymentIntent.client_secret })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.validate_post = async (req, res) => {
  const { user } = req.decoded
  // eslint-disable-next-line camelcase
  const { payment_intent } = req.body

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent)

    const payment = await Payment.findOne({
      paymentIntent: paymentIntent.id,
      user: user._id,
      status: 'pending',
    })

    if (!payment) {
      return res.status(404).send('Payment not found')
    }

    if (paymentIntent.status === 'succeeded') {
      payment.status = 'executed'
      await payment.save()
      await User.updateOne(
        { _id: user._id },
        { $inc: { cash: payment.quantity } }
      )
      await Transaction.create({
        user: user._id,
        amount: payment.quantity,
        type: 'payment',
        payment: payment._id,
      })
      return res.json({ success: true })
    }
    if (paymentIntent.status === 'canceled') {
      payment.status = 'cancelled'
      await payment.save()
      return res.json({ success: false })
    }
    return res.json({ success: false })
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.transactions_get = async (req, res) => {
  const { user } = req.decoded

  try {
    const transactions = await Transaction.find({ user: user._id }).sort({
      createdAt: -1,
    })

    return res.send(transactions)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
