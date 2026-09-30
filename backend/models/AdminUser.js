const mongoose = require('mongoose');

const AdminUserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    name: {
      type: String,
      default: "Hon'ble MLA, Goghat"
    },
    role: {
      type: String,
      default: 'Bidhayak / Chief Administrator'
    },
    lastPasswordResetAt: {
      type: Date,
      default: null
    },
    activeSessionToken: {
      type: String,
      default: null
    },
    sessionExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AdminUser', AdminUserSchema);
