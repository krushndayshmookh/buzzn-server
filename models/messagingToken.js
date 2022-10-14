/* eslint-disable func-names */
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const MessagingTokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      dropDups: true,
    },
    user: {
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

MessagingTokenSchema.plugin(mongoosePaginate)

const MessagingTokenModel = mongoose.model('MessagingToken', MessagingTokenSchema)

module.exports = {
  name: 'MessagingToken',
  model: MessagingTokenModel,
  schema: MessagingTokenSchema,
}
