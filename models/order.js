const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const Schema = mongoose.Schema

const OrderSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    instrument: {
      type: Schema.Types.ObjectId,
      ref: 'Instrument',
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
    transactionType: {
      type: String,
      enum: ['buy', 'sell'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'executed', 'cancelled'],
      default: 'pending',
    },
    type: {
      type: String,
      enum: ['market', 'limit'],
    },
    trades: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Trades',
      },
    ],
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

OrderSchema.virtual('averagePrice').get(function () {
  if (!this.transactions || this.transactions.length === 0) {
    return 0
  }
  const totalPrice = this.transactions.reduce((total, transaction) => {
    return total + transaction.price * transaction.quantity
  }, 0)
  return totalPrice / this.transactions.length
})

OrderSchema.virtual('matchedQuantity').get(function () {
  if (!this.transactions || this.transactions.length === 0) {
    return 0
  }
  const qty = this.transactions.reduce((total, transaction) => {
    return total + transaction.quantity
  }, 0)
  return qty
})

OrderSchema.virtual('unmatchedQuantity').get(function () {
  return this.quantity - this.matchedQuantity
})

OrderSchema.plugin(mongoosePaginate)

const OrderModel = mongoose.model('Order', OrderSchema)

module.exports = {
  name: 'Order',
  model: OrderModel,
  schema: OrderSchema,
}
