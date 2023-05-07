const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const TickSchema = new Schema(
  {
    instrument: {
      type: Schema.Types.ObjectId,
      ref: 'Instrument',
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
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

TickSchema.plugin(mongoosePaginate)

const TickModel = mongoose.model('Tick', TickSchema)

module.exports = {
  name: 'Tick',
  model: TickModel,
  schema: TickSchema,
}
