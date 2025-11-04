const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // Allow null values to be non-unique
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: '',
    },
    location: {
      type: String,
      maxlength: [100, 'Location cannot exceed 100 characters'],
      default: '',
    },
    website: {
      type: String,
      maxlength: [200, 'Website URL cannot exceed 200 characters'],
      validate: {
        validator: function (v) {
          // URL validation (optional field)
          if (!v) return true;
          return /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/.test(v);
        },
        message: 'Invalid website URL',
      },
      default: '',
    },
    coverImage: {
      type: String,
      default: null,
    },
    walletAddress: {
      type: String,
      unique: true,
      sparse: true, // Allow null values
      lowercase: true,
      validate: {
        validator: function (v) {
          // Ethereum address validation (0x followed by 40 hex characters)
          return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: 'Invalid Ethereum wallet address',
      },
    },
    walletVerified: {
      type: Boolean,
      default: false,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    // Social stats
    followersCount: {
      type: Number,
      default: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    // Metadata
    lastLogin: {
      type: Date,
      default: null,
    },
    lastLoginIp: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes
// Indexes are automatically created by unique: true, so we only need non-unique indexes
userSchema.index({ createdAt: -1 });

// Virtual for auth relationship
userSchema.virtual('auth', {
  ref: 'Auth',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
});

// Instance method to check if user has password auth
userSchema.methods.hasPasswordAuth = async function () {
  const Auth = mongoose.model('Auth');
  const auth = await Auth.findOne({ userId: this._id });
  return !!auth;
};

// Instance method to update last login
userSchema.methods.updateLastLogin = async function (ip) {
  this.lastLogin = new Date();
  this.lastLoginIp = ip;
  await this.save();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
