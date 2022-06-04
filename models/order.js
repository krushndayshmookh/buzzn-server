/* eslint-disable func-names */
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

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
      enum: ['buy', 'sell', 'fresh-sell'],
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
        ref: 'Trade',
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

OrderSchema.virtual('totalAmount').get(function () {
  if (!this.trades || this.trades.length === 0) {
    return 0
  }
  const totalAmount = this.trades.reduce(
    (total, trade) => total + trade.price * trade.quantity,
    0
  )
  return totalAmount
})

OrderSchema.virtual('averagePrice').get(function () {
  if (!this.trades || this.trades.length === 0) {
    return 0
  }
  return this.totalAmount / this.matchedQuantity
})

OrderSchema.virtual('matchedQuantity').get(function () {
  if (!this.trades || this.trades.length === 0) {
    return 0
  }
  const qty = this.trades.reduce((total, trade) => total + trade.quantity, 0)
  return qty
})

OrderSchema.virtual('unmatchedQuantity').get(function () {
  return this.quantity - this.matchedQuantity
})

OrderSchema.virtual('totalCommission').get(function () {
  if (this.transactionType === 'buy') {
    return 0
  }
  if (!this.trades || this.trades.length === 0) {
    return 0
  }
  const totalCommission = this.trades.reduce(
    (total, trade) => total + trade.ownerCommission + trade.systemCommission,
    0
  )
  return totalCommission
})

OrderSchema.virtual('finalAmount').get(function () {
  return this.totalAmount - this.totalCommission
})

OrderSchema.plugin(mongoosePaginate)

const OrderModel = mongoose.model('Order', OrderSchema)

module.exports = {
  name: 'Order',
  model: OrderModel,
  schema: OrderSchema,
}
