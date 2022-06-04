const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const InstrumentSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    minted: {
      type: Number,
      required: true,
      default: 0,
    },
    floating: {
      type: Number,
      required: true,
      default: 0,
    },
    fresh: {
      type: Number,
      required: true,
      default: 0,
    },
    symbol: {
      type: String,
      required: true,
      unique: true,
    },
    ltp: {
      type: Number,
      required: true,
      default: 10,
    },
    delta: {
      type: Number,
      required: true,
      default: 0,
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

InstrumentSchema.plugin(mongoosePaginate)

const InstrumentModel = mongoose.model('Instrument', InstrumentSchema)

module.exports = {
  name: 'Instrument',
  model: InstrumentModel,
  schema: InstrumentSchema,
}
