const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const BlocklistSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    blockedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

BlocklistSchema.plugin(mongoosePaginate)

const BlocklistModel = mongoose.model('Blocklist', BlocklistSchema)

module.exports = {
  name: 'Blocklist',
  model: BlocklistModel,
  schema: BlocklistSchema,
}
