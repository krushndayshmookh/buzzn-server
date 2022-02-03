const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const Schema = mongoose.Schema

const BookmarkSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
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

BookmarkSchema.plugin(mongoosePaginate)

const BookmarkModel = mongoose.model('Bookmark', BookmarkSchema)

module.exports = {
  name: 'Bookmark',
  model: BookmarkModel,
  schema: BookmarkSchema,
}
