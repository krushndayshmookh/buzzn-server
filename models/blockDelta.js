const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const Schema = mongoose.Schema

const BlockDeltaSchema = new Schema(
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
    type: {
      type: String,
      enum: [
        'mint',
        'buy',
        'sell',
        'float',
        'fresh-buy',
        'fresh-sell',
      ],
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
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

BlockDeltaSchema.plugin(mongoosePaginate)

const BlockDeltaModel = mongoose.model('BlockDelta', BlockDeltaSchema)

module.exports = {
  name: 'BlockDelta',
  model: BlockDeltaModel,
  schema: BlockDeltaSchema,
}
