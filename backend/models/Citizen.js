const mongoose = require('mongoose');

const CitizenSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true
    },
    name: {
      type: String,
      required: [true, 'Citizen name is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    wardOrPanchayat: {
      type: String,
      required: [true, 'Gram Panchayat is required'],
      default: 'Kamarpukur'
    },
    villageOrArea: {
      type: String,
      required: [true, 'Village name is required'],
      trim: true
    },
    voterId: {
      type: String,
      required: [true, 'Voter ID is mandatory'],
      trim: true
    },
    aadhaar: {
      type: String,
      required: [true, '12-digit Aadhaar number is mandatory'],
      trim: true
    },
    aadhaarLast4: {
      type: String,
      default: '',
      trim: true
    },
    password: {
      type: String,
      default: 'citizen123'
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
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Citizen', CitizenSchema);
