const mongoose = require('mongoose')
const mongoosePaginate = require('mongoose-paginate')

const { Schema } = mongoose

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
    bio: {
      type: String,
    },
    type: {
      type: String,
      enum: ['root', 'base', 'bot'],
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
    isVerified: {
      type: Boolean,
      default: false,
    },
    chips: {
      type: Number,
      default: 1000,
    },
    money: {
      type: Number,
      default: 0,
    },
    defaultCurrency: {
      type: String,
      default: 'INR',
    },
    lockedMoney: [
      {
        order: {
          type: Schema.Types.ObjectId,
          ref: 'Order',
        },
        currency: {
          type: String,
          enum: ['INR', 'CHIPS'],
        },
        amount: {
          type: Number,
          default: 0,
        },
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

UserSchema.virtual('followersCount', {
  ref: 'Follower',
  localField: '_id',
  foreignField: 'user',
  count: true,
})

UserSchema.virtual('followingCount', {
  ref: 'Follower',
  localField: '_id',
  foreignField: 'follower',
  count: true,
})

UserSchema.plugin(mongoosePaginate)

const UserModel = mongoose.model('User', UserSchema)

module.exports = {
  name: 'User',
  model: UserModel,
  schema: UserSchema,
}
