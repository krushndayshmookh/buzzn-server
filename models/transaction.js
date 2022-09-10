const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const TransactionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      required: true,
      default: 'INR',
    },
    type: {
      type: String,
      enum: [
        'payment',
        'payout',
        'admin-payment',
        'admin-payout',
        'trade-sell',
        'trade-buy',
        'trade-fresh-buy',
        'trade-fresh-sell',
        'trade-commission',
      ],
      default: 'payment',
    },
    payment: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
    trade: {
      type: Schema.Types.ObjectId,
      ref: 'Trade',
    },
    // payout: {
    //   type: Schema.Types.ObjectId,
    //   ref: 'Payout',
    // },
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

TransactionSchema.plugin(mongoosePaginate)

const TransactionModel = mongoose.model('Transaction', TransactionSchema)

module.exports = {
  name: 'Transaction',
  model: TransactionModel,
  schema: TransactionSchema,
}
