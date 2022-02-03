const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const Schema = mongoose.Schema

const FollowerSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    follower: {
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

FollowerSchema.plugin(mongoosePaginate)

const FollowerModel = mongoose.model('Follower', FollowerSchema)

module.exports = {
  name: 'Follower',
  model: FollowerModel,
  schema: FollowerSchema,
}
