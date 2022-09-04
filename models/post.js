const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const PostSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'article', 'image', 'video', 'audio'],
      required: true,
    },
    requireMinShares: {
      type: Number,
      default: 0,
    },
    content: {
      text: {
        content: {
          type: String,
        },
        color: {
          type: String,
        },
        textColor: {
          type: String,
        },
        font: {
          type: String,
        },
      },
      article: {
        title: {
          type: String,
        },
        content: {
          type: String,
        },
      },
      image: {
        content: {
          type: String,
        },
        caption: {
          type: String,
        },
        thumbnail: {
          type: String,
        },
        original: {
          type: String,
        },
        originalFilename: {
          type: String,
        },
      },
      video: {
        content: {
          type: String,
        },
        thumbnail: {
          type: String,
        },
      },
      audio: {
        content: {
          type: String,
        },
        title: {
          type: String,
        },
        thumbnail: {
          type: String,
        },
        original: {
          type: String,
        },
        originalFilename: {
          type: String,
        },
        cover: {
          content: {
            type: String,
          },
          original: {
            type: String,
          },
          originalFilename: {
            type: String,
          },
        },
      },
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

PostSchema.virtual('likesCount', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'post',
  count: true,
})

PostSchema.virtual('commentsCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true,
})

PostSchema.plugin(mongoosePaginate)

const PostModel = mongoose.model('Post', PostSchema)

module.exports = {
  name: 'Post',
  model: PostModel,
  schema: PostSchema,
}
