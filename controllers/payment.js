const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

const { Payment, User } = require('../models')

const CHIP_PRICE = require('../configs/chipPrice')

exports.checkout_post = async (req, res) => {
  const { user } = req.decoded
  let { quantity } = req.body

  quantity = parseFloat(quantity)
  let price = CHIP_PRICE.INR

  try {
    const priceInPaise = price * 100
    const amount = priceInPaise * quantity

    let payment = new Payment({
      user: user._id,
      quantity,
      price,
      currency: 'INR',
      status: 'pending',
    })

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
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
  const { payment_intent } = req.body

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent)

    let payment = await Payment.findOne({
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
        { $inc: { chips: payment.quantity } }
      )
      return res.json({ success: true })
    } else if (paymentIntent.status === 'canceled') {
      payment.status = 'cancelled'
      await payment.save()
      return res.json({ success: false })
    } else {
      return res.json({ success: false })
    }
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}

exports.transactions_get = async (req, res) => {
  const { user } = req.decoded

  try {
    const payments = await Payment.find({ user: user._id })
    .sort({ createdAt: -1 })

    return res.send(payments)
  } catch (err) {
    console.error({ err })
    return res.status(500).send({ err })
  }
}
