const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const UserCategorySchema = new Schema(
  {
    name: {
      type: String,
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

UserCategorySchema.plugin(mongoosePaginate)

const UserCategoryModel = mongoose.model('UserCategory', UserCategorySchema)

module.exports = {
  name: 'UserCategory',
  model: UserCategoryModel,
  schema: UserCategorySchema,
}
