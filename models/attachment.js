const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const AttachmentSchema = new Schema(
  {
    message: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true,
    },
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'file'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    thumbnail: {
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

AttachmentSchema.plugin(mongoosePaginate)

const AttachmentModel = mongoose.model('Attachment', AttachmentSchema)

module.exports = {
  name: 'Attachment',
  model: AttachmentModel,
  schema: AttachmentSchema,
}
