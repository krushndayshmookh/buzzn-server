/* eslint-disable func-names */
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const ReportSchema = new Schema(
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
    reason: {
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

ReportSchema.plugin(mongoosePaginate)

const ReportModel = mongoose.model('Report', ReportSchema)

module.exports = {
  name: 'Report',
  model: ReportModel,
  schema: ReportSchema,
}
