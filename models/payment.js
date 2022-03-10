const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const Schema = mongoose.Schema

const PaymentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      required: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['pending', 'executed', 'cancelled'],
      default: 'pending',
    },
    paymentIntent: {
      type: String,
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObjects: {
      virtuals: true,
    },
    timestamps: true,
  }
)

PaymentSchema.plugin(mongoosePaginate)

const PaymentModel = mongoose.model('Payment', PaymentSchema)

module.exports = {
  name: 'Payment',
  model: PaymentModel,
  schema: PaymentSchema,
}
