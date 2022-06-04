const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const WatchlistSchema = new Schema(
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

WatchlistSchema.plugin(mongoosePaginate)

const WatchlistModel = mongoose.model('Watchlist', WatchlistSchema)

module.exports = {
  name: 'Watchlist',
  model: WatchlistModel,
  schema: WatchlistSchema,
}
