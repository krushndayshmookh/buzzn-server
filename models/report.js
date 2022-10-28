/* eslint-disable func-names */
const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

const ReportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: false,
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
