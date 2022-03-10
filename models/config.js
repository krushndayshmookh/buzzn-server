const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const Schema = mongoose.Schema

const ConfigSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    commission: {
      type: Number,
      required: true,
      default: 0,
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

ConfigSchema.plugin(mongoosePaginate)

const ConfigModel = mongoose.model('Config', ConfigSchema)

module.exports = {
  name: 'Config',
  model: ConfigModel,
  schema: ConfigSchema,
}
