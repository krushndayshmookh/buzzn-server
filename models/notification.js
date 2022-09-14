const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const NotificationSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    trigger:{
      type: String,
      required: true,
      enum: ['order', 'like', 'comment', 'follow', 'mention', 'message'],
    }
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

NotificationSchema.plugin(mongoosePaginate)

const NotificationModel = mongoose.model('Notification', NotificationSchema)

module.exports = {
  name: 'Notification',
  model: NotificationModel,
  schema: NotificationSchema,
}
