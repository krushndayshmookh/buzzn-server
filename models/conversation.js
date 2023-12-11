const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const ConversationSchema = new Schema(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ['private', 'group'],
    },
    title: {
      type: String,
      required: false,
    },
    avatar: {
      type: String,
      required: false,
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

ConversationSchema.virtual('lastMessage', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation',
  options: { sort: { createdAt: -1 }, limit: 1 },
})

ConversationSchema.plugin(mongoosePaginate)

const ConversationModel = mongoose.model('Conversation', ConversationSchema)

module.exports = {
  name: 'Conversation',
  model: ConversationModel,
  schema: ConversationSchema,
}
