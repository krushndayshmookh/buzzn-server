const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const Schema = mongoose.Schema

const UserSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      dropDups: true,
    },
    phone: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      dropDups: true,
    },
    authProvider: {
      type: String,
      required: true,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    type: {
      type: String,
      enum: ['root', 'base'],
      required: true,
      default: 'base',
    },
    avatar: {
      type: String,
      required: true,
      default:
        'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y',
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'UserCategory',
      },
    ],
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

UserSchema.plugin(mongoosePaginate)

const UserModel = mongoose.model('User', UserSchema)

module.exports = {
  name: 'User',
  model: UserModel,
  schema: UserSchema,
}
