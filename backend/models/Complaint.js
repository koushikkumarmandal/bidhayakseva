const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    // Personal details of citizen
    citizen: {
      name: {
        type: String,
        required: [true, 'Citizen name is required'],
        trim: true
      },
      phone: {
        type: String,
        required: [true, 'Valid phone number is required'],
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      address: {
        type: String,
        required: [true, 'Citizen address is required'],
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
        trim: true
      }
    },
    // Place details
    placeDetails: {
      wardOrPanchayat: {
        type: String,
        required: [true, 'Ward or Gram Panchayat is required'],
        trim: true
      },
      villageOrArea: {
        type: String,
        required: [true, 'Village or Area name is required'],
        trim: true
      },
      landmark: {
        type: String,
        trim: true
      },
      pinCode: {
        type: String,
        trim: true
      }
    },
    // Grievance / Problem details
    problemType: {
      type: String,
      required: [true, 'Problem category is required'],
      enum: [
        'Roads & Infrastructure',
        'Drinking Water Supply',
        'Electricity & Streetlights',
        'Drainage & Sanitation',
        'Healthcare & Hospitals',
        'Ration & Food Security',
        'Education & Schools',
        'Social Welfare & Pensions',
        'Law & Order / Public Safety',
        'Agriculture & Irrigation',
        'Other Public Grievance'
      ]
    },
    subject: {
      type: String,
      required: [true, 'Complaint subject/title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Detailed problem description is required'],
      trim: true
    },
    reliefNeeded: {
      type: String,
      required: [true, 'Please specify what action/relief is needed from the MLA office'],
      trim: true
    },
    attachmentUrl: {
      type: String,
      default: ''
    },
    // Bidhayak / Admin Workflow fields
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Emergency'],
      default: 'Medium'
    },
    assignedDepartment: {
      type: String,
      default: 'MLA Grievance Cell'
    },
    adminRemarks: {
      type: String,
      default: 'Ticket received and queued for review by the Bidhayak Seva Kendra team.'
    },
    rejectionReason: {
      type: String,
      default: ''
    },
    actionHistory: [
      {
        status: { type: String, required: true },
        remarks: { type: String, default: '' },
        updatedBy: { type: String, default: 'Bidhayak Office' },
        updatedAt: { type: Date, default: Date.now }
      }
    ],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Complaint', ComplaintSchema);
