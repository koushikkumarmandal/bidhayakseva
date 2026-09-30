const dotenv = require('dotenv');
const { connectDB, getDbStatus } = require('../config/db');
const Complaint = require('../models/Complaint');
const Citizen = require('../models/Citizen');

dotenv.config();

const sampleComplaints = [
  {
    ticketId: 'BSK-2026-1001',
    citizen: {
      name: 'Subir Karmakar',
      phone: '9830123456',
      email: 'subir.karmakar@example.com',
      address: 'Kamarpukur Main Road, Near Math',
      voterId: 'WB/29/201/014521',
      aadhaarLast4: '4821'
    },
    placeDetails: {
      wardOrPanchayat: 'Kamarpukur Gram Panchayat',
      villageOrArea: 'Kamarpukur Bazar',
      landmark: 'Near Ramakrishna Math',
      pinCode: '712612'
    },
    problemType: 'Roads & Infrastructure',
    subject: 'Kamarpukur to Jayrambati connecting road broken with deep craters',
    description: 'The main tourist and commuter road connecting Kamarpukur temple with Jayrambati has severe potholes. During recent monsoon rains, public buses and ambulance movement have been badly disrupted.',
    reliefNeeded: 'Urgent blacktopping and resurfacing under MLA Area Development Fund or PWD special road repair grant.',
    priority: 'High',
    status: 'In Progress',
    assignedDepartment: 'PWD Road Division (Arambagh & Goghat)',
    adminRemarks: 'Hon\'ble MLA inspected the site. PWD Executive Engineer directed to prepare immediate repair estimate.',
    rejectionReason: '',
    actionHistory: [
      {
        status: 'Pending',
        remarks: 'Complaint registered by citizen through Seva Kendra portal.',
        updatedBy: 'Citizen Portal',
        updatedAt: new Date(Date.now() - 4 * 86400000)
      },
      {
        status: 'In Progress',
        remarks: 'MLA office reviewed and issued immediate inspection order to PWD Arambagh Division.',
        updatedBy: 'Bidhayak Office',
        updatedAt: new Date(Date.now() - 2 * 86400000)
      }
    ],
    submittedAt: new Date(Date.now() - 4 * 86400000)
  },
  {
    ticketId: 'BSK-2026-1002',
    citizen: {
      name: 'Ruma Mukherjee',
      phone: '9123456780',
      email: 'ruma.m@example.com',
      address: 'Goghat Station Road, Goghat Bazar',
      voterId: 'WB/29/201/087102',
      aadhaarLast4: '9012'
    },
    placeDetails: {
      wardOrPanchayat: 'Goghat Gram Panchayat',
      villageOrArea: 'Goghat Station Area',
      landmark: 'Near Railway Station Gate',
      pinCode: '712614'
    },
    problemType: 'Drinking Water Supply',
    subject: 'Drinking water pipeline ruptured in Goghat station market area',
    description: 'The public drinking water supply line behind Goghat station market broke 5 days ago. Dirty water is entering consumer taps, affecting over 120 local families.',
    reliefNeeded: 'Immediate PHE pipeline inspection, pipe replacement, and deployment of temporary water tanker.',
    priority: 'Emergency',
    status: 'Approved',
    assignedDepartment: 'Public Health Engineering (PHE) & Water Supply',
    adminRemarks: 'Sanctioned emergency pipeline replacement work. Mobile water tanker dispatched by Goghat Block administration.',
    rejectionReason: '',
    actionHistory: [
      {
        status: 'Pending',
        remarks: 'Complaint registered with emergency flag.',
        updatedBy: 'Citizen Portal',
        updatedAt: new Date(Date.now() - 3 * 86400000)
      },
      {
        status: 'In Progress',
        remarks: 'Water supply tanker dispatched by BDO office.',
        updatedBy: 'Bidhayak Office',
        updatedAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        status: 'Approved',
        remarks: 'Work order approved & fund allocated for new pipeline fitting.',
        updatedBy: 'Bidhayak Office',
        updatedAt: new Date(Date.now() - 1 * 86400000)
      }
    ],
    submittedAt: new Date(Date.now() - 3 * 86400000),
    resolvedAt: new Date(Date.now() - 1 * 86400000)
  },
  {
    ticketId: 'BSK-2026-1003',
    citizen: {
      name: 'Bimal Santra',
      phone: '9876543210',
      email: '',
      address: 'Badanganj Primary School Para',
      voterId: 'WB/29/201/112940',
      aadhaarLast4: '3341'
    },
    placeDetails: {
      wardOrPanchayat: 'Badanganj-Faluigram GP',
      villageOrArea: 'Badanganj West',
      landmark: 'Beside Badanganj High School',
      pinCode: '712602'
    },
    problemType: 'Electricity & Streetlights',
    subject: 'Transformer failure causing 4-day blackout in agricultural pump zone',
    description: 'The 25 KVA agricultural transformer at Badanganj snapped 4 days ago. Farmers are unable to pump irrigation water to paddy fields.',
    reliefNeeded: 'Immediate replacement of damaged transformer by WBSEDCL Goghat division.',
    priority: 'High',
    status: 'Pending',
    assignedDepartment: 'MLA Grievance Cell',
    adminRemarks: 'Ticket received and queued for review by the Bidhayak Seva Kendra team.',
    rejectionReason: '',
    actionHistory: [
      {
        status: 'Pending',
        remarks: 'Complaint registered by citizen.',
        updatedBy: 'Citizen Portal',
        updatedAt: new Date(Date.now() - 1 * 86400000)
      }
    ],
    submittedAt: new Date(Date.now() - 1 * 86400000)
  },
  {
    ticketId: 'BSK-2026-1004',
    citizen: {
      name: 'Prabir Ghosh',
      phone: '9433011223',
      email: 'prabir.ghosh@example.com',
      address: 'Bengai Bazar, Post Bengai',
      voterId: 'WB/29/201/063019',
      aadhaarLast4: '7789'
    },
    placeDetails: {
      wardOrPanchayat: 'Bengai Gram Panchayat',
      villageOrArea: 'Bengai College Road',
      landmark: 'Near Aghorehore College Gate',
      pinCode: '712611'
    },
    problemType: 'Drainage & Sanitation',
    subject: 'Open roadside drainage choked causing overflow onto college bypass',
    description: 'The stormwater drain running along Bengai college road is choked with silt and debris, overflowing into student walking areas.',
    reliefNeeded: 'Desilting of main drain with suction machine and concrete slabs over open sections.',
    priority: 'Medium',
    status: 'In Progress',
    assignedDepartment: 'Panchayat Samiti Sanitation Department (Goghat-I)',
    adminRemarks: 'BDO notified. Joint inspection scheduled with Gram Panchayat Pradhan.',
    rejectionReason: '',
    actionHistory: [
      {
        status: 'Pending',
        remarks: 'Complaint registered.',
        updatedBy: 'Citizen Portal',
        updatedAt: new Date(Date.now() - 5 * 86400000)
      },
      {
        status: 'In Progress',
        remarks: 'Inspection team dispatched by BDO Goghat-I.',
        updatedBy: 'Bidhayak Office',
        updatedAt: new Date(Date.now() - 2 * 86400000)
      }
    ],
    submittedAt: new Date(Date.now() - 5 * 86400000)
  },
  {
    ticketId: 'BSK-2026-1005',
    citizen: {
      name: 'Sunita Roy',
      phone: '9748990011',
      email: '',
      address: 'Bali Village, Post Bali',
      voterId: 'WB/29/201/024098',
      aadhaarLast4: '6120'
    },
    placeDetails: {
      wardOrPanchayat: 'Bali Gram Panchayat',
      villageOrArea: 'Bali Uttarpara',
      landmark: 'Near Bali Sitala Temple',
      pinCode: '712614'
    },
    problemType: 'Other Public Grievance',
    subject: 'Financial grant for building private brick fence on private homestead',
    description: 'Applicant requesting ₹75,000 grant from MLA Local Area Development Fund for building boundary wall around private ancestral plot.',
    reliefNeeded: 'Cash grant from MLA LAD fund.',
    priority: 'Low',
    status: 'Rejected',
    assignedDepartment: 'MLA Grievance Cell',
    adminRemarks: 'Application rejected: Under Government of West Bengal BEUP/LAD fund guidelines, MLA constituency development funds cannot be utilized for private residential property works.',
    rejectionReason: 'MLA Constituency Development Funds are legally reserved strictly for public civic utilities, community halls, roads, and government facilities.',
    actionHistory: [
      {
        status: 'Pending',
        remarks: 'Complaint registered.',
        updatedBy: 'Citizen Portal',
        updatedAt: new Date(Date.now() - 6 * 86400000)
      },
      {
        status: 'Rejected',
        remarks: 'Rejected: Ineligible under government rules for public funds on personal real estate.',
        updatedBy: 'Bidhayak Office',
        updatedAt: new Date(Date.now() - 4 * 86400000)
      }
    ],
    submittedAt: new Date(Date.now() - 6 * 86400000)
  },
  {
    ticketId: 'BSK-2026-1006',
    citizen: {
      name: 'Tarun Mandal',
      phone: '9836778899',
      email: 'tarun.mandal@example.com',
      address: 'Nakunda More, Goghat-II',
      voterId: 'WB/29/201/052109',
      aadhaarLast4: '8834'
    },
    placeDetails: {
      wardOrPanchayat: 'Nakunda Gram Panchayat',
      villageOrArea: 'Nakunda Bazar',
      landmark: 'Near Primary Health Sub-Centre',
      pinCode: '712614'
    },
    problemType: 'Healthcare & Hospitals',
    subject: 'Emergency anti-venom shortage at Kamarpukur Rural Hospital / Goghat BPHC',
    description: 'Local agricultural workers face frequent snake bites in harvest season. The local Rural Hospital has run low on anti-venom vials, forcing transfers to Arambagh Sub-Divisional Hospital 25 km away.',
    reliefNeeded: 'Urgent restocking of 100 anti-venom vials and 24x7 ambulance availability at Kamarpukur / Goghat Rural Hospital.',
    priority: 'Emergency',
    status: 'In Progress',
    assignedDepartment: 'District Health & CMOH Hooghly',
    adminRemarks: 'Hon\'ble MLA intervened with CMOH Hooghly. 60 vials dispatched to Kamarpukur RH yesterday.',
    rejectionReason: '',
    actionHistory: [
      {
        status: 'Pending',
        remarks: 'Emergency healthcare ticket raised.',
        updatedBy: 'Citizen Portal',
        updatedAt: new Date(Date.now() - 2 * 86400000)
      },
      {
        status: 'In Progress',
        remarks: 'MLA spoke directly with CMOH Hooghly. Emergency stock dispatched.',
        updatedBy: 'Bidhayak Office',
        updatedAt: new Date(Date.now() - 1 * 86400000)
      }
    ],
    submittedAt: new Date(Date.now() - 2 * 86400000)
  }
];

const sampleCitizens = [
  {
    phone: '9830123456',
    name: 'Subir Karmakar',
    email: 'subir.karmakar@example.com',
    address: 'Kamarpukur Main Road, Near Math',
    wardOrPanchayat: 'Kamarpukur Gram Panchayat',
    villageOrArea: 'Kamarpukur Bazar',
    voterId: 'WB/29/201/014521',
    aadhaarLast4: '4821',
    isVerified: true
  },
  {
    phone: '9123456780',
    name: 'Ruma Mukherjee',
    email: 'ruma.m@example.com',
    address: 'Goghat Station Road, Goghat Bazar',
    wardOrPanchayat: 'Goghat Gram Panchayat',
    villageOrArea: 'Goghat Station Area',
    voterId: 'WB/29/201/087102',
    aadhaarLast4: '9012',
    isVerified: true
  }
];

const seedDB = async () => {
  try {
    const connected = await connectDB();
    if (!connected) {
      console.log('Skipping MongoDB seeding (running in resilient mode).');
      process.exit(0);
    }

    console.log('Clearing existing complaints and sample citizens for Goghat...');
    await Complaint.deleteMany({});
    await Citizen.deleteMany({});

    console.log(`Seeding ${sampleComplaints.length} Goghat constituency complaints...`);
    await Complaint.insertMany(sampleComplaints);

    console.log(`Seeding sample Goghat citizens...`);
    await Citizen.insertMany(sampleCitizens);

    console.log('✅ Goghat Assembly Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDB();
