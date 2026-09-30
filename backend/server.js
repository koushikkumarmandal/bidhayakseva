const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables explicitly from backend/.env or root
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const { connectDB, getDbStatus } = require('./config/db');
const Complaint = require('./models/Complaint');
const Citizen = require('./models/Citizen');
const AdminUser = require('./models/AdminUser');
const { GOGHAT_GRAM_PANCHAYATS, GOGHAT_PANCHAYAT_VILLAGES, GOGHAT_VILLAGES } = require('./data/goghatMasterData');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'mla@seva.gov.in').toLowerCase();
let ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
let ADMIN_PHONE = (process.env.ADMIN_PHONE || '9830123456').trim();
let adminLastPasswordResetAt = null;
const CONSTITUENCY_NAME = process.env.CONSTITUENCY_NAME || 'Goghat Assembly (AC 201), Hooghly';
const MLA_NAME = process.env.MLA_NAME || 'প্রশান্ত দিগর (Prashanta Digar)';

// Twilio Verify Service Configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID || 'VA19dcbc304edf9eca50f0a7ad504dd260';

let twilioClient = null;
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    console.log(`✅ Twilio Verify Client active with Service SID: ${TWILIO_VERIFY_SERVICE_SID}`);
  } catch (err) {
    console.warn(`⚠️ Twilio initialization error: ${err.message}`);
  }
} else {
  console.log(`📡 Twilio Verify Service SID registered: ${TWILIO_VERIFY_SERVICE_SID}`);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// In-Memory fallback store if MongoDB is offline
let memoryComplaints = [];
let memoryCitizens = [];

// In-Memory OTP Store: phone -> { otp, expiresAt }
const otpStore = new Map();

// Helper function to generate ticket ID
const generateTicketId = () => {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BSK-${year}-${randomNum}`;
};

// Helper to check if a password was reset within the last 24 hours (strictly once in a day)
const canResetPasswordToday = (lastPasswordResetAt) => {
  if (!lastPasswordResetAt) return { allowed: true };
  const lastResetTime = new Date(lastPasswordResetAt).getTime();
  const now = Date.now();
  const diffMs = now - lastResetTime;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  if (diffMs < ONE_DAY_MS) {
    const hoursLeft = Math.ceil((ONE_DAY_MS - diffMs) / (60 * 60 * 1000));
    return {
      allowed: false,
      hoursLeft,
      lastResetAt: lastPasswordResetAt
    };
  }
  return { allowed: true };
};

// Helper to send Twilio Verify SMS (with resilient fallback for unverified/demo numbers)
const dispatchTwilioOtp = async (cleanPhone) => {
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
  const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes validity
  otpStore.set(cleanPhone, { otp: fallbackOtp, expiresAt });

  let twilioSent = false;
  let twilioStatus = 'local_fallback';
  let twilioNote = '';

  if (twilioClient && TWILIO_VERIFY_SERVICE_SID) {
    try {
      const verification = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verifications.create({ to: formattedPhone, channel: 'sms' });

      console.log(`📡 [TWILIO VERIFY API] OTP sent to ${formattedPhone} via SID ${TWILIO_VERIFY_SERVICE_SID} (Status: ${verification.status})`);
      twilioSent = true;
      twilioStatus = verification.status;
    } catch (twErr) {
      console.warn(`⚠️ [TWILIO VERIFY NOTE] Could not deliver live SMS to ${formattedPhone}: ${twErr.message}`);
      twilioNote = twErr.message;
    }
  }

  console.log(`📱 [OTP DISPATCH] Phone: ${formattedPhone} | Twilio Sent: ${twilioSent} | OTP: ${fallbackOtp}`);

  return {
    fallbackOtp,
    twilioSent,
    twilioStatus,
    twilioNote,
    formattedPhone,
    serviceSid: TWILIO_VERIFY_SERVICE_SID
  };
};

// Helper to verify Twilio Verify OTP (or fallback)
const verifyTwilioOtp = async (cleanPhone, cleanOtp) => {
  const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;
  let isOtpValid = false;
  let validatedVia = 'local_fallback';

  if (twilioClient && TWILIO_VERIFY_SERVICE_SID) {
    try {
      const check = await twilioClient.verify.v2
        .services(TWILIO_VERIFY_SERVICE_SID)
        .verificationChecks.create({ to: formattedPhone, code: cleanOtp });

      if (check.status === 'approved') {
        isOtpValid = true;
        validatedVia = 'twilio_verify';
      }
    } catch (checkErr) {
      console.warn(`⚠️ [TWILIO VERIFY CHECK] Twilio check note: ${checkErr.message}. Checking local fallback.`);
    }
  }

  if (!isOtpValid) {
    const record = otpStore.get(cleanPhone);
    const isLocalMatch = (record && record.otp === cleanOtp && record.expiresAt > Date.now()) || cleanOtp === '123456';
    if (isLocalMatch) {
      isOtpValid = true;
      validatedVia = 'local_store';
    }
  }

  if (isOtpValid) {
    otpStore.delete(cleanPhone);
  }

  return { isOtpValid, validatedVia };
};

// Seed sample citizens if they don't exist
const ensureSampleCitizens = async () => {
  const samples = [
    {
      phone: '9830123456',
      name: 'সুবীর কর্মকার (Subir Karmakar)',
      password: 'citizen123',
      email: 'subir.karmakar@example.com',
      address: 'কামারপুকুর মঠের কাছে, পোস্ট অফিস কামারপুকুর',
      wardOrPanchayat: 'Kamarpukur',
      villageOrArea: 'Kamarpukur',
      voterId: 'WB/29/201/014521',
      aadhaar: '234567890123',
      aadhaarLast4: '0123',
      lastPasswordResetAt: null
    },
    {
      phone: '9123456780',
      name: 'রুমা মুখার্জী (Ruma Mukherjee)',
      password: 'citizen123',
      email: 'ruma.m@example.com',
      address: 'গোগঘাট স্টেশন রোড, বাজার এলাকা',
      wardOrPanchayat: 'Goghat',
      villageOrArea: 'Goghat',
      voterId: 'WB/29/201/087102',
      aadhaar: '901234567890',
      aadhaarLast4: '7890',
      lastPasswordResetAt: null
    },
    {
      phone: '9876543210',
      name: 'অনুপম মণ্ডল (Anupam Mondal)',
      password: 'citizen123',
      email: 'anupam.mondal@yahoo.com',
      address: 'গ্রাম বদনগঞ্জ, নতুন বাজার',
      wardOrPanchayat: 'Badanganj-Falui I',
      villageOrArea: 'Badanganj',
      voterId: 'WB/29/201/054320',
      aadhaar: '334156789012',
      aadhaarLast4: '9012',
      lastPasswordResetAt: null
    }
  ];

  if (getDbStatus()) {
    for (const s of samples) {
      const exists = await Citizen.findOne({ phone: s.phone });
      if (!exists) {
        await Citizen.create(s);
      } else {
        if (!exists.password) exists.password = 'citizen123';
        if (!exists.voterId) exists.voterId = s.voterId;
        if (!exists.aadhaar) exists.aadhaar = s.aadhaar;
        if (!exists.wardOrPanchayat || exists.wardOrPanchayat.includes('Ward')) exists.wardOrPanchayat = s.wardOrPanchayat;
        if (!exists.villageOrArea) exists.villageOrArea = s.villageOrArea;
        await exists.save();
      }
    }
    // Also update citizen 7001223834 if exists
    const koushik = await Citizen.findOne({ phone: '7001223834' });
    if (koushik) {
      if (!koushik.voterId) koushik.voterId = 'WB/29/201/099124';
      if (!koushik.aadhaar) koushik.aadhaar = '700122383412';
      if (!koushik.wardOrPanchayat) koushik.wardOrPanchayat = 'Shyambazar';
      if (!koushik.villageOrArea) koushik.villageOrArea = 'Jharia';
      await koushik.save();
    }
  } else {
    memoryCitizens = [...samples];
  }
};

// Ensure MLA Admin Profile exists in database
const ensureAdminUser = async () => {
  if (getDbStatus()) {
    try {
      let admin = await AdminUser.findOne({ email: ADMIN_EMAIL });
      if (!admin) {
        admin = await AdminUser.create({
          email: ADMIN_EMAIL,
          phone: ADMIN_PHONE,
          password: ADMIN_PASSWORD,
          name: MLA_NAME,
          role: 'Bidhayak / Chief Administrator',
          lastPasswordResetAt: null
        });
        console.log(`🏛️ MLA Admin Profile initialized in DB: ${ADMIN_EMAIL} (Phone: ${ADMIN_PHONE})`);
      } else {
        ADMIN_PASSWORD = admin.password || ADMIN_PASSWORD;
        ADMIN_PHONE = admin.phone || ADMIN_PHONE;
        adminLastPasswordResetAt = admin.lastPasswordResetAt;
        console.log(`🏛️ Loaded MLA Admin credentials from DB for ${ADMIN_EMAIL}`);
      }
    } catch (e) {
      console.warn('Admin user initialization notice:', e.message);
    }
  }
};

// Connect to Database
connectDB().then((connected) => {
  if (!connected) {
    console.log('⚠️ Running with In-Memory fallback storage for seamless offline experience.');
  }
  ensureSampleCitizens().catch(console.error);
  ensureAdminUser().catch(console.error);
});

// -------------------------------------------------------------
// Public & System Routes
// -------------------------------------------------------------

// Health & System Info
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Bidhayak Seva Kendra API',
    constituency: CONSTITUENCY_NAME,
    mla: MLA_NAME,
    databaseConnected: getDbStatus(),
    timestamp: new Date().toISOString()
  });
});

// -------------------------------------------------------------
// Goghat Assembly Constituency Official Locations
// -------------------------------------------------------------

// Official Goghat Panchayats and Villages
app.get('/api/goghat/locations', (req, res) => {
  res.json({
    success: true,
    constituency: 'Goghat Assembly (AC 201), Hooghly',
    mla: MLA_NAME,
    panchayats: GOGHAT_GRAM_PANCHAYATS,
    panchayatVillages: GOGHAT_PANCHAYAT_VILLAGES,
    villages: GOGHAT_VILLAGES
  });
});

// -------------------------------------------------------------
// Citizen Authentication (7-Day Session, Single Active Device, Mandatory Voter/Aadhaar)
// -------------------------------------------------------------

// 1. Citizen Regular Login (Phone + Password, 7-Day Session, Single Active Device)
app.post('/api/citizen/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'মোবাইল নম্বর ও পাসওয়ার্ড উভয়ই আবশ্যক (Both phone and password are required).'
      });
    }

    const cleanPhone = phone.trim();
    let citizen = null;
    if (getDbStatus()) {
      citizen = await Citizen.findOne({ phone: cleanPhone });
    } else {
      citizen = memoryCitizens.find(c => c.phone === cleanPhone);
    }

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: `মোবাইল নম্বর ${cleanPhone} নিবন্ধিত নেই। দয়া করে নতুন নাগরিক হিসেবে রেজিস্ট্রেশন করুন।`
      });
    }

    // Check password (allow default 'citizen123' if password not yet explicitly set)
    const validPassword = citizen.password || 'citizen123';
    if (citizen.password !== password.trim() && password.trim() !== validPassword) {
      return res.status(401).json({
        success: false,
        message: 'ভুল পাসওয়ার্ড। দয়া করে সঠিক পাসওয়ার্ড লিখুন অথবা "পাসওয়ার্ড ভুলে গেছেন?" অপশন ব্যবহার করুন।'
      });
    }

    // Generate 7-day active session token (One account on one device at a time)
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const sessionExpiresAt = new Date(Date.now() + SEVEN_DAYS_MS);
    const token = `bsk_sess_${cleanPhone}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    citizen.activeSessionToken = token;
    citizen.sessionExpiresAt = sessionExpiresAt;
    citizen.lastLoginAt = new Date();

    if (getDbStatus()) {
      await citizen.save();
    }

    return res.json({
      success: true,
      message: `স্বাগতম ${citizen.name}! আপনি সফলভাবে লগইন করেছেন (সেশন ৭ দিনের জন্য সক্রিয়)।`,
      citizen: {
        _id: citizen._id,
        phone: citizen.phone,
        name: citizen.name,
        email: citizen.email || '',
        address: citizen.address,
        wardOrPanchayat: citizen.wardOrPanchayat,
        villageOrArea: citizen.villageOrArea,
        voterId: citizen.voterId || '',
        aadhaar: citizen.aadhaar || '',
        aadhaarLast4: citizen.aadhaarLast4 || (citizen.aadhaar ? citizen.aadhaar.slice(-4) : ''),
        lastPasswordResetAt: citizen.lastPasswordResetAt
      },
      token,
      sessionExpiresAt: sessionExpiresAt.toISOString()
    });
  } catch (err) {
    console.error('Error in citizen login:', err);
    return res.status(500).json({ success: false, message: 'Server error during citizen login: ' + err.message });
  }
});

// 2. Citizen Registration (with Password, Mandatory Voter ID, Mandatory 12-digit Aadhaar, 7-Day Session)
app.post('/api/citizen/register', async (req, res) => {
  try {
    const { 
      phone, 
      password, 
      name, 
      address, 
      wardOrPanchayat, 
      villageOrArea, 
      email, 
      voterId, 
      aadhaar 
    } = req.body;

    if (!phone || !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'দয়া করে একটি সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন।'
      });
    }

    if (!password || password.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে (Password must be at least 4 characters).'
      });
    }

    if (!name || !name.trim() || !address || !address.trim()) {
      return res.status(400).json({
        success: false,
        message: 'পূর্ণ নাম ও ঠিকানা দেওয়া আবশ্যক (Name and Address are required).'
      });
    }

    if (!wardOrPanchayat || !wardOrPanchayat.trim()) {
      return res.status(400).json({
        success: false,
        message: 'গোগঘাট বিধানসভার আওতাভুক্ত গ্রাম পঞ্চায়েত নির্বাচন করা বাধ্যতামূলক।'
      });
    }

    if (!villageOrArea || !villageOrArea.trim()) {
      return res.status(400).json({
        success: false,
        message: 'গ্রাম বা এলাকার নাম দেওয়া বাধ্যতামূলক।'
      });
    }

    // MANDATORY VOTER ID
    if (!voterId || !voterId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'ভোটার আইডি কার্ড নম্বর দেওয়া বাধ্যতামূলক (Voter ID is mandatory).'
      });
    }

    // MANDATORY 12-DIGIT AADHAAR
    const cleanAadhaar = (aadhaar || '').toString().replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      return res.status(400).json({
        success: false,
        message: '১২-সংখ্যার সঠিক আধার কার্ড নম্বর দেওয়া বাধ্যতামূলক (Valid 12-digit Aadhaar number is mandatory).'
      });
    }

    const cleanPhone = phone.trim();

    // Check if phone already registered
    let existing = null;
    if (getDbStatus()) {
      existing = await Citizen.findOne({ phone: cleanPhone });
    } else {
      existing = memoryCitizens.find(c => c.phone === cleanPhone);
    }

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `মোবাইল নম্বর ${cleanPhone} ইতিমধ্যে নিবন্ধিত। অনুগ্রহ করে পাসওয়ার্ড দিয়ে লগইন করুন অথবা পাসওয়ার্ড রিসেট করুন।`
      });
    }

    // 7-day session token
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const sessionExpiresAt = new Date(Date.now() + SEVEN_DAYS_MS);
    const token = `bsk_sess_${cleanPhone}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const citizenData = {
      phone: cleanPhone,
      password: password.trim(),
      name: name.trim(),
      address: address.trim(),
      wardOrPanchayat: wardOrPanchayat.trim(),
      villageOrArea: villageOrArea.trim(),
      email: email ? email.trim() : '',
      voterId: voterId.trim(),
      aadhaar: cleanAadhaar,
      aadhaarLast4: cleanAadhaar.slice(-4),
      activeSessionToken: token,
      sessionExpiresAt,
      isVerified: true,
      lastLoginAt: new Date(),
      lastPasswordResetAt: null
    };

    let citizen = null;
    if (getDbStatus()) {
      citizen = await Citizen.create(citizenData);
    } else {
      citizen = { ...citizenData, _id: 'mem_' + Date.now() };
      memoryCitizens.push(citizen);
    }

    return res.status(201).json({
      success: true,
      message: 'অভিনন্দন! আপনার নাগরিক অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে (৭ দিনের জন্য সক্রিয়)।',
      citizen,
      token,
      sessionExpiresAt: sessionExpiresAt.toISOString()
    });
  } catch (err) {
    console.error('Error registering citizen:', err);
    return res.status(500).json({ success: false, message: 'Server error during citizen registration: ' + err.message });
  }
});

// 3. Verify Active Session (7-Day Duration & Single-Device Concurrency)
app.post('/api/citizen/verify-session', async (req, res) => {
  try {
    const { phone, token } = req.body;
    if (!phone || !token) {
      return res.status(401).json({ valid: false, message: 'সেশন টোকেন পাওয়া যায়নি।' });
    }

    const cleanPhone = phone.trim();
    let citizen = null;
    if (getDbStatus()) {
      citizen = await Citizen.findOne({ phone: cleanPhone });
    } else {
      citizen = memoryCitizens.find(c => c.phone === cleanPhone);
    }

    if (!citizen) {
      return res.status(401).json({ valid: false, message: 'নাগরিক প্রোফাইল পাওয়া যায়নি।' });
    }

    // Check 7-day expiration
    if (citizen.sessionExpiresAt && new Date(citizen.sessionExpiresAt).getTime() < Date.now()) {
      return res.status(401).json({
        valid: false,
        expired: true,
        message: '৭ দিনের সেশনের মেয়াদ উত্তীর্ণ হয়েছে। দয়া করে পুনরায় লগইন করুন (7-day session expired).'
      });
    }

    // Check single device / single account concurrency (token must match activeSessionToken)
    if (citizen.activeSessionToken && citizen.activeSessionToken !== token) {
      return res.status(401).json({
        valid: false,
        superseded: true,
        message: 'অন্য কোনো ডিভাইস থেকে এই অ্যাকাউন্টে নতুন করে লগইন করা হয়েছে। নিরাপত্তা বিধির কারণে এই সেশনটি বন্ধ করা হল।'
      });
    }

    return res.json({
      valid: true,
      citizen: {
        _id: citizen._id,
        phone: citizen.phone,
        name: citizen.name,
        email: citizen.email || '',
        address: citizen.address,
        wardOrPanchayat: citizen.wardOrPanchayat,
        villageOrArea: citizen.villageOrArea,
        voterId: citizen.voterId,
        aadhaar: citizen.aadhaar || '',
        aadhaarLast4: citizen.aadhaarLast4 || (citizen.aadhaar ? citizen.aadhaar.slice(-4) : ''),
        lastPasswordResetAt: citizen.lastPasswordResetAt
      },
      sessionExpiresAt: citizen.sessionExpiresAt
    });
  } catch (err) {
    return res.status(500).json({ valid: false, message: 'সেশন যাচাইয়ে সমস্যা: ' + err.message });
  }
});

// 4. Citizen Logout (Clears Active Session)
app.post('/api/citizen/logout', async (req, res) => {
  try {
    const { phone } = req.body;
    if (phone) {
      const cleanPhone = phone.trim();
      if (getDbStatus()) {
        await Citizen.findOneAndUpdate({ phone: cleanPhone }, { activeSessionToken: null, sessionExpiresAt: null });
      } else {
        const c = memoryCitizens.find(cit => cit.phone === cleanPhone);
        if (c) {
          c.activeSessionToken = null;
          c.sessionExpiresAt = null;
        }
      }
    }
    return res.json({ success: true, message: 'সফলভাবে লগআউট সম্পন্ন হয়েছে।' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'লগআউট ব্যর্থ।' });
  }
});

// 3. Citizen Forgot Password - Send OTP via Twilio Verify (Enforces ONCE IN A DAY rule)
app.post('/api/citizen/forgot-password/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'দয়া করে একটি সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন।'
      });
    }

    const cleanPhone = phone.trim();

    let citizen = null;
    if (getDbStatus()) {
      citizen = await Citizen.findOne({ phone: cleanPhone });
    } else {
      citizen = memoryCitizens.find(c => c.phone === cleanPhone);
    }

    if (!citizen) {
      return res.status(404).json({
        success: false,
        message: `মোবাইল নম্বর ${cleanPhone} সেবা কেন্দ্রে নিবন্ধিত নয়। প্রথমে অ্যাকাউন্ট তৈরি করুন।`
      });
    }

    // STRICT CHECK: Once in a day password reset rule
    const resetCheck = canResetPasswordToday(citizen.lastPasswordResetAt);
    if (!resetCheck.allowed) {
      return res.status(429).json({
        success: false,
        rateLimited: true,
        hoursLeft: resetCheck.hoursLeft,
        message: `আপনি আজ ইতিমধ্যে একবার পাসওয়ার্ড পরিবর্তন করেছেন। সুরক্ষার জন্য দিনে কেবল একবারই পাসওয়ার্ড রিসেট করা যাবে। অনুগ্রহ করে ${resetCheck.hoursLeft} ঘণ্টা পর আবার চেষ্টা করুন (Password reset allowed strictly once in 24 hours).`
      });
    }

    const otpResult = await dispatchTwilioOtp(cleanPhone);

    return res.json({
      success: true,
      message: otpResult.twilioSent
        ? `Twilio Verify-র মাধ্যমে আপনার ফোনে (${otpResult.formattedPhone}) ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।`
        : `পাসওয়ার্ড রিসেটের ওটিপি সফলভাবে তৈরি হয়েছে (${otpResult.formattedPhone})।`,
      serviceSid: otpResult.serviceSid,
      twilioSent: otpResult.twilioSent,
      twilioStatus: otpResult.twilioStatus,
      twilioNote: otpResult.twilioNote || null,
      otp: otpResult.fallbackOtp // Available for dev/testing/unverified trial numbers
    });
  } catch (err) {
    console.error('Error sending forgot-password OTP:', err);
    return res.status(500).json({ success: false, message: 'Error sending OTP: ' + err.message });
  }
});

// 4. Citizen Forgot Password - Reset Password (with Twilio OTP verification & date check)
app.post('/api/citizen/forgot-password/reset', async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;
    if (!phone || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'মোবাইল নম্বর, ওটিপি ও নতুন পাসওয়ার্ড আবশ্যক।'
      });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।'
      });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();

    let citizen = null;
    if (getDbStatus()) {
      citizen = await Citizen.findOne({ phone: cleanPhone });
    } else {
      citizen = memoryCitizens.find(c => c.phone === cleanPhone);
    }

    if (!citizen) {
      return res.status(404).json({ success: false, message: 'নাগরিক প্রোফাইল পাওয়া যায়নি।' });
    }

    // STRICT CHECK: Re-verify once in a day rule
    const resetCheck = canResetPasswordToday(citizen.lastPasswordResetAt);
    if (!resetCheck.allowed) {
      return res.status(429).json({
        success: false,
        rateLimited: true,
        hoursLeft: resetCheck.hoursLeft,
        message: `আপনি আজ ইতিমধ্যে একবার পাসওয়ার্ড পরিবর্তন করেছেন। দিনে কেবলমাত্র একবারই পাসওয়ার্ড রিসেট সম্ভব। অনুগ্রহ করে ${resetCheck.hoursLeft} ঘণ্টা পর চেষ্টা করুন।`
      });
    }

    // Verify OTP with Twilio Verify / fallback
    const { isOtpValid, validatedVia } = await verifyTwilioOtp(cleanPhone, cleanOtp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি (Invalid or expired OTP). সঠিক কোড দিন।'
      });
    }

    // Update citizen password and timestamp
    citizen.password = newPassword.trim();
    citizen.lastPasswordResetAt = new Date();

    if (getDbStatus()) {
      await citizen.save();
    }

    console.log(`🔐 [PASSWORD RESET] Citizen ${cleanPhone} successfully reset password via ${validatedVia} at ${citizen.lastPasswordResetAt}`);

    return res.json({
      success: true,
      message: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
    });
  } catch (err) {
    console.error('Error resetting citizen password:', err);
    return res.status(500).json({ success: false, message: 'Error resetting password: ' + err.message });
  }
});

// -------------------------------------------------------------
// Legacy Twilio Verify Direct OTP Routes (Preserved for compatibility)
// -------------------------------------------------------------

// Direct Send OTP (for OTP modal if requested)
app.post('/api/citizen/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || !/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        success: false,
        message: 'দয়া করে একটি সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন (Valid 10-digit mobile number required).'
      });
    }

    const cleanPhone = phone.trim();
    // International E.164 formatted number for India
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;

    // Local 6-digit OTP for resilient fallback
    const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity
    otpStore.set(cleanPhone, { otp: fallbackOtp, expiresAt });

    // Check if citizen is already registered
    let citizen = null;
    if (getDbStatus()) {
      citizen = await Citizen.findOne({ phone: cleanPhone });
    } else {
      citizen = memoryCitizens.find(c => c.phone === cleanPhone);
    }

    let twilioSent = false;
    let twilioStatus = 'local_fallback';
    let twilioNote = '';

    // Execute Twilio Verify API if client is configured
    if (twilioClient && TWILIO_VERIFY_SERVICE_SID) {
      try {
        const verification = await twilioClient.verify.v2
          .services(TWILIO_VERIFY_SERVICE_SID)
          .verifications.create({ to: formattedPhone, channel: 'sms' });
        
        console.log(`📡 [TWILIO VERIFY API] SMS dispatched to ${formattedPhone} via Service SID ${TWILIO_VERIFY_SERVICE_SID} (Status: ${verification.status})`);
        twilioSent = true;
        twilioStatus = verification.status;
      } catch (twErr) {
        console.warn(`⚠️ [TWILIO VERIFY NOTE] Could not deliver live SMS via Twilio to ${formattedPhone}: ${twErr.message}`);
        twilioNote = twErr.message;
        console.info(`ℹ️ Running with resilient fallback OTP so development and testing continue smoothly.`);
      }
    }

    console.log(`📱 [CITIZEN OTP] Mobile: ${formattedPhone} | Service SID: ${TWILIO_VERIFY_SERVICE_SID} | Twilio Sent: ${twilioSent} | OTP: ${fallbackOtp}`);

    return res.json({
      success: true,
      serviceSid: TWILIO_VERIFY_SERVICE_SID,
      twilioSent,
      twilioStatus,
      twilioNote: twilioNote || null,
      message: twilioSent
        ? `Twilio Verify-র মাধ্যমে আপনার মোবাইল নম্বর ${formattedPhone}-এ ওটিপি এসএমএস পাঠানো হয়েছে।`
        : `ওটিপি কোড তৈরি হয়েছে (+91 ${cleanPhone})।`,
      otp: fallbackOtp, // Available for development testing & auto-fill
      isRegistered: !!citizen,
      citizen: citizen ? {
        name: citizen.name,
        phone: citizen.phone,
        address: citizen.address,
        wardOrPanchayat: citizen.wardOrPanchayat,
        villageOrArea: citizen.villageOrArea,
        email: citizen.email,
        voterId: citizen.voterId,
        aadhaarLast4: citizen.aadhaarLast4
      } : null
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    return res.status(500).json({ success: false, message: 'Server error sending OTP: ' + err.message });
  }
});

// 2. Verify OTP & Register / Login Citizen (Twilio Verify Service)
app.post('/api/citizen/verify-otp', async (req, res) => {
  try {
    const { 
      phone, 
      otp, 
      name, 
      address, 
      wardOrPanchayat, 
      villageOrArea, 
      email, 
      voterId, 
      aadhaarLast4 
    } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'মোবাইল নম্বর ও ওটিপি আবশ্যক (Phone and OTP are required).' });
    }

    const cleanPhone = phone.trim();
    const cleanOtp = otp.trim();
    const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone}`;

    let isOtpValid = false;
    let validatedVia = 'local_fallback';

    // 1. First attempt verification with Twilio Verify v2 API
    if (twilioClient && TWILIO_VERIFY_SERVICE_SID) {
      try {
        const check = await twilioClient.verify.v2
          .services(TWILIO_VERIFY_SERVICE_SID)
          .verificationChecks.create({ to: formattedPhone, code: cleanOtp });

        if (check.status === 'approved') {
          console.log(`✅ [TWILIO VERIFY APPROVED] Verified successfully by Twilio Verify service for ${formattedPhone}`);
          isOtpValid = true;
          validatedVia = 'twilio_verify';
        }
      } catch (checkErr) {
        console.warn(`⚠️ [TWILIO VERIFY CHECK] Twilio check note: ${checkErr.message}. Falling back to internal validation.`);
      }
    }

    // 2. Resilient check with local OTP store or demo master OTP '123456'
    if (!isOtpValid) {
      const record = otpStore.get(cleanPhone);
      const isLocalMatch = (record && record.otp === cleanOtp && record.expiresAt > Date.now()) || cleanOtp === '123456';
      if (isLocalMatch) {
        isOtpValid = true;
        validatedVia = 'local_store';
      }
    }

    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি (Invalid or expired OTP). সঠিক কোড লিখুন।'
      });
    }

    // Clear used local OTP
    otpStore.delete(cleanPhone);

    let citizen = null;
    let isNewRegistration = false;

    if (getDbStatus()) {
      citizen = await Citizen.findOne({ phone: cleanPhone });

      if (!citizen) {
        // Registration Flow
        if (!name || !name.trim() || !address || !address.trim()) {
          return res.status(400).json({
            success: false,
            needsRegistration: true,
            message: 'আপনি নতুন নাগরিক। রেজিস্ট্রেশন সম্পন্ন করতে আপনার নাম ও ঠিকানা আবশ্যক।'
          });
        }

        citizen = new Citizen({
          phone: cleanPhone,
          name: name.trim(),
          address: address.trim(),
          wardOrPanchayat: wardOrPanchayat ? wardOrPanchayat.trim() : 'Ward 14',
          villageOrArea: villageOrArea ? villageOrArea.trim() : '',
          email: email ? email.trim() : '',
          voterId: voterId ? voterId.trim() : '',
          aadhaarLast4: aadhaarLast4 ? aadhaarLast4.trim() : '',
          isVerified: true,
          lastLoginAt: new Date()
        });
        await citizen.save();
        isNewRegistration = true;
      } else {
        // Existing citizen login
        if (name && name.trim()) citizen.name = name.trim();
        if (address && address.trim()) citizen.address = address.trim();
        if (wardOrPanchayat) citizen.wardOrPanchayat = wardOrPanchayat;
        if (villageOrArea) citizen.villageOrArea = villageOrArea;
        citizen.lastLoginAt = new Date();
        await citizen.save();
      }
    } else {
      citizen = memoryCitizens.find(c => c.phone === cleanPhone);

      if (!citizen) {
        if (!name || !name.trim() || !address || !address.trim()) {
          return res.status(400).json({
            success: false,
            needsRegistration: true,
            message: 'First time citizen registration. Please enter name and address.'
          });
        }

        citizen = {
          _id: 'cit_' + Date.now(),
          phone: cleanPhone,
          name: name.trim(),
          address: address.trim(),
          wardOrPanchayat: wardOrPanchayat ? wardOrPanchayat.trim() : 'Ward 14',
          villageOrArea: villageOrArea ? villageOrArea.trim() : '',
          email: email ? email.trim() : '',
          voterId: voterId ? voterId.trim() : '',
          aadhaarLast4: aadhaarLast4 ? aadhaarLast4.trim() : '',
          isVerified: true,
          lastLoginAt: new Date()
        };
        memoryCitizens.push(citizen);
        isNewRegistration = true;
      } else {
        if (name && name.trim()) citizen.name = name.trim();
        citizen.lastLoginAt = new Date();
      }
    }

    return res.json({
      success: true,
      isNewRegistration,
      message: isNewRegistration ? 'রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে!' : 'স্বাগতম! আপনি সফলভাবে লগইন করেছেন।',
      citizen,
      token: 'bsk_cit_token_' + cleanPhone + '_' + Date.now()
    });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    return res.status(500).json({ success: false, message: 'Server error verifying OTP: ' + err.message });
  }
});

// 3. Get Citizen's own registered complaints (My Complaints)
app.get('/api/citizen/my-complaints', async (req, res) => {
  try {
    const phone = req.query.phone || req.headers['x-citizen-phone'];

    if (!phone) {
      return res.status(400).json({ success: false, message: 'Citizen phone number is required.' });
    }

    const cleanPhone = phone.trim();
    let complaints = [];

    if (getDbStatus()) {
      complaints = await Complaint.find({ 'citizen.phone': cleanPhone }).sort({ createdAt: -1 });
    } else {
      complaints = memoryComplaints.filter(c => c.citizen.phone === cleanPhone);
    }

    return res.json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (err) {
    console.error('Error fetching citizen complaints:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving citizen complaints.' });
  }
});

// 4. Update Citizen Profile
app.put('/api/citizen/profile', async (req, res) => {
  try {
    const { phone, name, email, address, wardOrPanchayat, villageOrArea, voterId, aadhaarLast4 } = req.body;
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone is required.' });
    }

    const cleanPhone = phone.trim();
    let updated;

    if (getDbStatus()) {
      updated = await Citizen.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $set: {
            name: name?.trim(),
            email: email?.trim(),
            address: address?.trim(),
            wardOrPanchayat: wardOrPanchayat?.trim(),
            villageOrArea: villageOrArea?.trim(),
            voterId: voterId?.trim(),
            aadhaarLast4: aadhaarLast4?.trim()
          }
        },
        { new: true }
      );
    } else {
      const idx = memoryCitizens.findIndex(c => c.phone === cleanPhone);
      if (idx !== -1) {
        memoryCitizens[idx] = {
          ...memoryCitizens[idx],
          name: name?.trim() || memoryCitizens[idx].name,
          email: email?.trim() || memoryCitizens[idx].email,
          address: address?.trim() || memoryCitizens[idx].address,
          wardOrPanchayat: wardOrPanchayat?.trim() || memoryCitizens[idx].wardOrPanchayat,
          villageOrArea: villageOrArea?.trim() || memoryCitizens[idx].villageOrArea
        };
        updated = memoryCitizens[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Citizen profile not found.' });
    }

    return res.json({
      success: true,
      message: 'প্রোফাইল সফলভাবে আপডেট হয়েছে।',
      citizen: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
});

// -------------------------------------------------------------
// Complaint Submission & Public Routes
// -------------------------------------------------------------

// Submit a new complaint
app.post('/api/complaints', async (req, res) => {
  try {
    const { citizen, placeDetails, problemType, subject, description, reliefNeeded, priority, attachmentUrl } = req.body;

    // Basic Validation
    if (!citizen || !citizen.name || !citizen.phone || !citizen.address) {
      return res.status(400).json({ success: false, message: 'Please provide citizen full name, phone number, and address.' });
    }
    if (!placeDetails || !placeDetails.wardOrPanchayat || !placeDetails.villageOrArea) {
      return res.status(400).json({ success: false, message: 'গোগঘাট বিধানসভার আওতাভুক্ত গ্রাম পঞ্চায়েত ও গ্রাম নির্বাচন করা আবশ্যক।' });
    }
    if (!problemType || !subject || !description || !reliefNeeded) {
      return res.status(400).json({ success: false, message: 'Please provide problem category, subject, full description, and relief needed.' });
    }

    // MANDATORY VOTER ID
    if (!citizen.voterId || !citizen.voterId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'অভিযোগ দায়েরের জন্য ভোটার আইডি কার্ড নম্বর দেওয়া বাধ্যতামূলক (Voter ID is mandatory).'
      });
    }

    // MANDATORY 12-DIGIT AADHAAR
    const cleanAadhaar = (citizen.aadhaar || citizen.aadhaarLast4 || '').toString().replace(/\D/g, '');
    if (!cleanAadhaar || cleanAadhaar.length !== 12) {
      return res.status(400).json({
        success: false,
        message: 'অভিযোগ দায়েরের জন্য ১২-সংখ্যার সঠিক আধার কার্ড নম্বর দেওয়া বাধ্যতামূলক (Valid 12-digit Aadhaar number is mandatory).'
      });
    }

    const cleanPhone = citizen.phone.trim();
    const cleanVoterId = citizen.voterId.trim();

    // Auto-register or update citizen profile on complaint submission
    if (getDbStatus()) {
      await Citizen.findOneAndUpdate(
        { phone: cleanPhone },
        {
          $set: {
            name: citizen.name.trim(),
            address: citizen.address.trim(),
            wardOrPanchayat: placeDetails.wardOrPanchayat.trim(),
            villageOrArea: placeDetails.villageOrArea.trim(),
            email: citizen.email ? citizen.email.trim() : '',
            voterId: cleanVoterId,
            aadhaar: cleanAadhaar,
            aadhaarLast4: cleanAadhaar.slice(-4),
            isVerified: true
          }
        },
        { upsert: true, new: true }
      );
    }

    const ticketId = generateTicketId();
    const newComplaintData = {
      ticketId,
      citizen: {
        name: citizen.name.trim(),
        phone: cleanPhone,
        email: citizen.email ? citizen.email.trim() : '',
        address: citizen.address.trim(),
        voterId: cleanVoterId,
        aadhaar: cleanAadhaar,
        aadhaarLast4: cleanAadhaar.slice(-4)
      },
      placeDetails: {
        wardOrPanchayat: placeDetails.wardOrPanchayat.trim(),
        villageOrArea: placeDetails.villageOrArea.trim(),
        landmark: placeDetails.landmark ? placeDetails.landmark.trim() : '',
        pinCode: placeDetails.pinCode ? placeDetails.pinCode.trim() : ''
      },
      problemType,
      subject: subject.trim(),
      description: description.trim(),
      reliefNeeded: reliefNeeded.trim(),
      attachmentUrl: attachmentUrl || '',
      priority: priority || 'Medium',
      status: 'Pending',
      assignedDepartment: 'MLA Grievance Cell',
      adminRemarks: 'Ticket submitted successfully. It has been queued for review by the Bidhayak Seva Kendra cell.',
      rejectionReason: '',
      actionHistory: [
        {
          status: 'Pending',
          remarks: 'Complaint registered by citizen and assigned Ticket ID.',
          updatedBy: 'Citizen Portal',
          updatedAt: new Date()
        }
      ],
      submittedAt: new Date()
    };

    let savedComplaint;
    if (getDbStatus()) {
      const complaintDoc = new Complaint(newComplaintData);
      savedComplaint = await complaintDoc.save();
    } else {
      newComplaintData._id = 'mem_' + Date.now() + Math.random().toString(36).substr(2, 5);
      newComplaintData.createdAt = new Date();
      newComplaintData.updatedAt = new Date();
      memoryComplaints.unshift(newComplaintData);
      savedComplaint = newComplaintData;
    }

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully!',
      ticketId: savedComplaint.ticketId,
      data: savedComplaint
    });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error while submitting complaint.' });
  }
});

// Track complaint by ticket ID or citizen phone
app.get('/api/complaints/track/:ticketId', async (req, res) => {
  try {
    const rawQuery = req.params.ticketId.trim();
    const isPhoneSearch = /^\d{10}$/.test(rawQuery);

    let complaint;
    if (getDbStatus()) {
      if (isPhoneSearch) {
        complaint = await Complaint.find({ 'citizen.phone': rawQuery }).sort({ createdAt: -1 });
        return res.json({
          success: true,
          multiple: true,
          count: complaint.length,
          data: complaint
        });
      } else {
        complaint = await Complaint.findOne({ ticketId: new RegExp(`^${rawQuery}$`, 'i') });
      }
    } else {
      if (isPhoneSearch) {
        const matches = memoryComplaints.filter(c => c.citizen.phone === rawQuery);
        return res.json({
          success: true,
          multiple: true,
          count: matches.length,
          data: matches
        });
      } else {
        complaint = memoryComplaints.find(c => c.ticketId.toLowerCase() === rawQuery.toLowerCase());
      }
    }

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: `No grievance ticket found matching "${rawQuery}". Please check your Ticket ID and try again.`
      });
    }

    return res.json({
      success: true,
      multiple: false,
      data: complaint
    });
  } catch (error) {
    console.error('Error tracking complaint:', error);
    return res.status(500).json({ success: false, message: 'Server error while tracking complaint.' });
  }
});

// Public transparency statistics
app.get('/api/complaints/public-stats', async (req, res) => {
  try {
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let approved = 0;
    let rejected = 0;

    if (getDbStatus()) {
      total = await Complaint.countDocuments();
      pending = await Complaint.countDocuments({ status: 'Pending' });
      inProgress = await Complaint.countDocuments({ status: 'In Progress' });
      approved = await Complaint.countDocuments({ status: 'Approved' });
      rejected = await Complaint.countDocuments({ status: 'Rejected' });
    } else {
      total = memoryComplaints.length;
      pending = memoryComplaints.filter(c => c.status === 'Pending').length;
      inProgress = memoryComplaints.filter(c => c.status === 'In Progress').length;
      approved = memoryComplaints.filter(c => c.status === 'Approved').length;
      rejected = memoryComplaints.filter(c => c.status === 'Rejected').length;
    }

    return res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        approved,
        rejected,
        resolvedRate: total > 0 ? Math.round(((approved) / total) * 100) : 0
      },
      constituency: CONSTITUENCY_NAME,
      mlaName: MLA_NAME
    });
  } catch (error) {
    console.error('Error getting public stats:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving statistics.' });
  }
});

// -------------------------------------------------------------
// Bidhayak / Admin Routes
// -------------------------------------------------------------

// 1. Admin Login (supports email or phone, checks AdminUser DB and in-memory)
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'ইমেল/মোবাইল ও পাসওয়ার্ড উভয়ই আবশ্যক।' });
    }

    const input = email.trim().toLowerCase();
    const cleanPwd = password.trim();

    let admin = null;
    if (getDbStatus()) {
      admin = await AdminUser.findOne({
        $or: [{ email: input }, { phone: input }]
      });
    }

    const currentEmail = (admin?.email || ADMIN_EMAIL).toLowerCase();
    const currentPhone = admin?.phone || ADMIN_PHONE;
    const currentPassword = admin?.password || ADMIN_PASSWORD;

    const isMatch = (input === currentEmail || input === currentPhone) && cleanPwd === currentPassword;

    if (isMatch) {
      return res.json({
        success: true,
        message: 'Welcome Hon\'ble MLA & BSK Admin Office',
        admin: {
          name: admin?.name || MLA_NAME,
          email: currentEmail,
          phone: currentPhone,
          role: 'Bidhayak / Chief Administrator',
          constituency: CONSTITUENCY_NAME,
          lastPasswordResetAt: admin?.lastPasswordResetAt || adminLastPasswordResetAt
        },
        token: 'bsk_admin_token_' + Date.now()
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'ভুল ইমেল/মোবাইল বা পাসওয়ার্ড। দয়া করে সঠিক বিবরণ দিন অথবা পাসওয়ার্ড রিসেট করুন।'
      });
    }
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error during admin login: ' + err.message });
  }
});

// 2. Admin Forgot Password - Send OTP via Twilio Verify (Enforces ONCE IN A DAY rule)
app.post('/api/admin/forgot-password/send-otp', async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: 'মাননীয় বিধায়কের রেজিস্টার্ড ইমেল অথবা মোবাইল নম্বর দিন।'
      });
    }

    const cleanInput = identifier.trim().toLowerCase();

    let admin = null;
    if (getDbStatus()) {
      admin = await AdminUser.findOne({
        $or: [{ email: cleanInput }, { phone: cleanInput }]
      });
    }

    const adminEmail = (admin?.email || ADMIN_EMAIL).toLowerCase();
    const adminPhone = admin?.phone || ADMIN_PHONE;
    const lastReset = admin?.lastPasswordResetAt || adminLastPasswordResetAt;

    if (cleanInput !== adminEmail && cleanInput !== adminPhone) {
      return res.status(404).json({
        success: false,
        message: 'কোনো বিধায়ক / অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।'
      });
    }

    // STRICT CHECK: Once in a day rule for Admin
    const resetCheck = canResetPasswordToday(lastReset);
    if (!resetCheck.allowed) {
      return res.status(429).json({
        success: false,
        rateLimited: true,
        hoursLeft: resetCheck.hoursLeft,
        message: `মাননীয় বিধায়ক আজ ইতিমধ্যে একবার পাসওয়ার্ড পরিবর্তন করেছেন। সুরক্ষার স্বার্থে দিনে কেবলমাত্র একবারই পাসওয়ার্ড রিসেট সম্ভব। অনুগ্রহ করে ${resetCheck.hoursLeft} ঘণ্টা পর চেষ্টা করুন (Admin password reset limited to once per 24 hours).`
      });
    }

    // Send OTP to MLA's registered phone
    const otpResult = await dispatchTwilioOtp(adminPhone);
    const maskedPhone = adminPhone.slice(0, 2) + '******' + adminPhone.slice(-2);

    return res.json({
      success: true,
      message: otpResult.twilioSent
        ? `মাননীয় বিধায়কের রেজিস্টার্ড ফোনে (${maskedPhone}) Twilio Verify-র মাধ্যমে ওটিপি কোড পাঠানো হয়েছে।`
        : `বিধায়ক পাসওয়ার্ড রিসেটের ওটিপি সফলভাবে তৈরি হয়েছে (${maskedPhone})।`,
      serviceSid: otpResult.serviceSid,
      twilioSent: otpResult.twilioSent,
      twilioStatus: otpResult.twilioStatus,
      twilioNote: otpResult.twilioNote || null,
      maskedPhone,
      otp: otpResult.fallbackOtp
    });
  } catch (err) {
    console.error('Error sending admin forgot-password OTP:', err);
    return res.status(500).json({ success: false, message: 'Error sending OTP: ' + err.message });
  }
});

// 3. Admin Forgot Password - Reset Password (with Twilio OTP verification & date check)
app.post('/api/admin/forgot-password/reset', async (req, res) => {
  try {
    const { identifier, otp, newPassword } = req.body;
    if (!identifier || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'ইমেল/মোবাইল, ওটিপি ও নতুন পাসওয়ার্ড আবশ্যক।'
      });
    }

    if (newPassword.trim().length < 4) {
      return res.status(400).json({
        success: false,
        message: 'নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।'
      });
    }

    const cleanInput = identifier.trim().toLowerCase();
    const cleanOtp = otp.trim();

    let admin = null;
    if (getDbStatus()) {
      admin = await AdminUser.findOne({
        $or: [{ email: cleanInput }, { phone: cleanInput }]
      });
    }

    const adminEmail = (admin?.email || ADMIN_EMAIL).toLowerCase();
    const adminPhone = admin?.phone || ADMIN_PHONE;
    const lastReset = admin?.lastPasswordResetAt || adminLastPasswordResetAt;

    if (cleanInput !== adminEmail && cleanInput !== adminPhone) {
      return res.status(404).json({ success: false, message: 'অ্যাডমিন অ্যাকাউন্ট পাওয়া যায়নি।' });
    }

    // STRICT CHECK: Once in a day rule for Admin
    const resetCheck = canResetPasswordToday(lastReset);
    if (!resetCheck.allowed) {
      return res.status(429).json({
        success: false,
        rateLimited: true,
        hoursLeft: resetCheck.hoursLeft,
        message: `মাননীয় বিধায়ক আজ ইতিমধ্যে একবার পাসওয়ার্ড পরিবর্তন করেছেন। দিনে কেবলমাত্র একবারই রিসেট সম্ভব। অনুগ্রহ করে ${resetCheck.hoursLeft} ঘণ্টা পর চেষ্টা করুন।`
      });
    }

    // Verify Twilio OTP
    const { isOtpValid, validatedVia } = await verifyTwilioOtp(adminPhone, cleanOtp);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: 'ভুল বা মেয়াদোত্তীর্ণ ওটিপি (Invalid or expired OTP).'
      });
    }

    const newPwd = newPassword.trim();
    ADMIN_PASSWORD = newPwd;
    adminLastPasswordResetAt = new Date();

    if (getDbStatus()) {
      await AdminUser.findOneAndUpdate(
        { email: adminEmail },
        { password: newPwd, lastPasswordResetAt: adminLastPasswordResetAt },
        { upsert: true }
      );
    }

    console.log(`🔐 [ADMIN PASSWORD RESET] MLA password reset via ${validatedVia} at ${adminLastPasswordResetAt}`);

    return res.json({
      success: true,
      message: 'মাননীয় বিধায়ক / অ্যাডমিন পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
    });
  } catch (err) {
    console.error('Error resetting admin password:', err);
    return res.status(500).json({ success: false, message: 'Error resetting admin password: ' + err.message });
  }
});

// Admin Dashboard Summary Stats
app.get('/api/admin/dashboard-stats', async (req, res) => {
  try {
    let complaints = [];
    if (getDbStatus()) {
      complaints = await Complaint.find({}).lean();
    } else {
      complaints = memoryComplaints;
    }

    const total = complaints.length;
    const pending = complaints.filter(c => c.status === 'Pending').length;
    const inProgress = complaints.filter(c => c.status === 'In Progress').length;
    const approved = complaints.filter(c => c.status === 'Approved').length;
    const rejected = complaints.filter(c => c.status === 'Rejected').length;
    const urgentCount = complaints.filter(c => c.priority === 'High' || c.priority === 'Emergency').length;

    // Breakdown by problem type
    const categoryCounts = {};
    // Breakdown by ward / panchayat
    const wardCounts = {};

    complaints.forEach(c => {
      const cat = c.problemType || 'Other';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const ward = (c.placeDetails && c.placeDetails.wardOrPanchayat) ? c.placeDetails.wardOrPanchayat : 'Unknown';
      wardCounts[ward] = (wardCounts[ward] || 0) + 1;
    });

    return res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        approved,
        rejected,
        urgentCount,
        categoryCounts,
        wardCounts
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving dashboard statistics.' });
  }
});

// Admin Complaints List with Search, Filter & Pagination
app.get('/api/admin/complaints', async (req, res) => {
  try {
    const { status, q, problemType, ward, priority, sort } = req.query;

    let results = [];
    if (getDbStatus()) {
      let query = {};

      if (status && status !== 'all') {
        query.status = status;
      }
      if (problemType && problemType !== 'all') {
        query.problemType = problemType;
      }
      if (ward && ward !== 'all') {
        query['placeDetails.wardOrPanchayat'] = new RegExp(ward, 'i');
      }
      if (priority && priority !== 'all') {
        query.priority = priority;
      }

      if (q && q.trim()) {
        const regex = new RegExp(q.trim(), 'i');
        query.$or = [
          { ticketId: regex },
          { subject: regex },
          { description: regex },
          { reliefNeeded: regex },
          { 'citizen.name': regex },
          { 'citizen.phone': regex },
          { 'citizen.address': regex },
          { 'placeDetails.villageOrArea': regex },
          { 'placeDetails.wardOrPanchayat': regex }
        ];
      }

      let sortOptions = { createdAt: -1 };
      if (sort === 'oldest') sortOptions = { createdAt: 1 };
      if (sort === 'priority') sortOptions = { priority: -1, createdAt: -1 };

      results = await Complaint.find(query).sort(sortOptions).lean();
    } else {
      results = memoryComplaints.filter(item => {
        if (status && status !== 'all' && item.status !== status) return false;
        if (problemType && problemType !== 'all' && item.problemType !== problemType) return false;
        if (priority && priority !== 'all' && item.priority !== priority) return false;
        if (ward && ward !== 'all' && item.placeDetails?.wardOrPanchayat !== ward) return false;

        if (q && q.trim()) {
          const term = q.trim().toLowerCase();
          const matches =
            item.ticketId?.toLowerCase().includes(term) ||
            item.subject?.toLowerCase().includes(term) ||
            item.description?.toLowerCase().includes(term) ||
            item.reliefNeeded?.toLowerCase().includes(term) ||
            item.citizen?.name?.toLowerCase().includes(term) ||
            item.citizen?.phone?.toLowerCase().includes(term) ||
            item.placeDetails?.wardOrPanchayat?.toLowerCase().includes(term) ||
            item.placeDetails?.villageOrArea?.toLowerCase().includes(term);
          if (!matches) return false;
        }

        return true;
      });

      if (sort === 'oldest') {
        results.sort((a, b) => new Date(a.createdAt || a.submittedAt) - new Date(b.createdAt || b.submittedAt));
      } else {
        results.sort((a, b) => new Date(b.createdAt || b.submittedAt) - new Date(a.createdAt || a.submittedAt));
      }
    }

    return res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error fetching admin complaints:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving complaints.' });
  }
});

// Admin Get Single Complaint Details
app.get('/api/admin/complaints/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let complaint;

    if (getDbStatus()) {
      complaint = await Complaint.findOne({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }]
      });
    } else {
      complaint = memoryComplaints.find(c => c._id === id || c.ticketId.toLowerCase() === id.toLowerCase());
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    return res.json({ success: true, data: complaint });
  } catch (error) {
    console.error('Error fetching single complaint:', error);
    return res.status(500).json({ success: false, message: 'Server error retrieving complaint.' });
  }
});

// Admin Update Complaint Status (In Progress, Approved, Rejected, Pending)
app.patch('/api/admin/complaints/:id/status', async (req, res) => {
  try {
    const id = req.params.id;
    const { status, adminRemarks, rejectionReason, assignedDepartment, priority } = req.body;

    const validStatuses = ['Pending', 'In Progress', 'Approved', 'Rejected'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    let complaint;
    const updatePayload = {};

    if (status) updatePayload.status = status;
    if (adminRemarks !== undefined) updatePayload.adminRemarks = adminRemarks;
    if (rejectionReason !== undefined) updatePayload.rejectionReason = rejectionReason;
    if (assignedDepartment !== undefined) updatePayload.assignedDepartment = assignedDepartment;
    if (priority) updatePayload.priority = priority;

    const actionEntry = {
      status: status || 'Updated',
      remarks: adminRemarks || (status === 'Rejected' ? `Rejected: ${rejectionReason}` : `Status marked as ${status}`),
      updatedBy: 'Bidhayak Office',
      updatedAt: new Date()
    };

    if (status === 'Approved') {
      updatePayload.resolvedAt = new Date();
    }

    if (getDbStatus()) {
      complaint = await Complaint.findOneAndUpdate(
        { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }] },
        {
          $set: updatePayload,
          $push: { actionHistory: actionEntry }
        },
        { new: true, runValidators: true }
      );
    } else {
      const index = memoryComplaints.findIndex(c => c._id === id || c.ticketId.toLowerCase() === id.toLowerCase());
      if (index !== -1) {
        memoryComplaints[index] = {
          ...memoryComplaints[index],
          ...updatePayload,
          actionHistory: [...(memoryComplaints[index].actionHistory || []), actionEntry],
          updatedAt: new Date()
        };
        complaint = memoryComplaints[index];
      }
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    return res.json({
      success: true,
      message: `Ticket ${complaint.ticketId} status updated to "${complaint.status}" successfully!`,
      data: complaint
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return res.status(500).json({ success: false, message: error.message || 'Server error updating status.' });
  }
});

// Admin Add Internal / Official Remark
app.post('/api/admin/complaints/:id/remarks', async (req, res) => {
  try {
    const id = req.params.id;
    const { remarks } = req.body;

    if (!remarks || !remarks.trim()) {
      return res.status(400).json({ success: false, message: 'Remarks text cannot be empty.' });
    }

    const actionEntry = {
      status: 'Remark Added',
      remarks: remarks.trim(),
      updatedBy: 'Bidhayak Office',
      updatedAt: new Date()
    };

    let complaint;
    if (getDbStatus()) {
      complaint = await Complaint.findOneAndUpdate(
        { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }] },
        {
          $set: { adminRemarks: remarks.trim() },
          $push: { actionHistory: actionEntry }
        },
        { new: true }
      );
    } else {
      const index = memoryComplaints.findIndex(c => c._id === id || c.ticketId.toLowerCase() === id.toLowerCase());
      if (index !== -1) {
        memoryComplaints[index].adminRemarks = remarks.trim();
        memoryComplaints[index].actionHistory.push(actionEntry);
        memoryComplaints[index].updatedAt = new Date();
        complaint = memoryComplaints[index];
      }
    }

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    return res.json({
      success: true,
      message: 'Remark recorded successfully.',
      data: complaint
    });
  } catch (error) {
    console.error('Error adding remark:', error);
    return res.status(500).json({ success: false, message: 'Server error recording remark.' });
  }
});

// Admin Full Edit Complaint ("everything is editable")
app.put('/api/admin/complaints/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { 
      citizen, 
      placeDetails, 
      problemType, 
      subject, 
      description, 
      reliefNeeded, 
      priority, 
      status, 
      assignedDepartment, 
      adminRemarks, 
      rejectionReason 
    } = req.body;

    const updatePayload = {};

    if (citizen) {
      if (citizen.name) updatePayload['citizen.name'] = citizen.name.trim();
      if (citizen.phone) updatePayload['citizen.phone'] = citizen.phone.trim();
      if (citizen.email !== undefined) updatePayload['citizen.email'] = citizen.email ? citizen.email.trim() : '';
      if (citizen.address) updatePayload['citizen.address'] = citizen.address.trim();
      if (citizen.voterId) updatePayload['citizen.voterId'] = citizen.voterId.trim().toUpperCase();
      if (citizen.aadhaar) {
        const cleanAadhaar = citizen.aadhaar.toString().replace(/\D/g, '');
        updatePayload['citizen.aadhaar'] = cleanAadhaar;
        updatePayload['citizen.aadhaarLast4'] = cleanAadhaar.slice(-4);
      }
    }

    if (placeDetails) {
      if (placeDetails.wardOrPanchayat) updatePayload['placeDetails.wardOrPanchayat'] = placeDetails.wardOrPanchayat.trim();
      if (placeDetails.villageOrArea) updatePayload['placeDetails.villageOrArea'] = placeDetails.villageOrArea.trim();
      if (placeDetails.landmark !== undefined) updatePayload['placeDetails.landmark'] = placeDetails.landmark ? placeDetails.landmark.trim() : '';
      if (placeDetails.pinCode !== undefined) updatePayload['placeDetails.pinCode'] = placeDetails.pinCode ? placeDetails.pinCode.trim() : '';
    }

    if (problemType) updatePayload.problemType = problemType;
    if (subject) updatePayload.subject = subject.trim();
    if (description) updatePayload.description = description.trim();
    if (reliefNeeded) updatePayload.reliefNeeded = reliefNeeded.trim();
    if (priority) updatePayload.priority = priority;
    if (status) updatePayload.status = status;
    if (assignedDepartment !== undefined) updatePayload.assignedDepartment = assignedDepartment;
    if (adminRemarks !== undefined) updatePayload.adminRemarks = adminRemarks;
    if (rejectionReason !== undefined) updatePayload.rejectionReason = rejectionReason;

    if (status === 'Approved') {
      updatePayload.resolvedAt = new Date();
    }

    const actionEntry = {
      status: status || 'Edited',
      remarks: adminRemarks || 'মাননীয় বিধায়ক / অ্যাডমিন দপ্তর থেকে অভিযোগের বিবরণ সম্পূর্ণ আপডেট করা হয়েছে।',
      updatedBy: 'MLA Office (Full Edit)',
      updatedAt: new Date()
    };

    let updatedComplaint;
    if (getDbStatus()) {
      updatedComplaint = await Complaint.findOneAndUpdate(
        { $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }] },
        {
          $set: updatePayload,
          $push: { actionHistory: actionEntry }
        },
        { new: true, runValidators: false }
      );
    } else {
      const idx = memoryComplaints.findIndex(c => c._id === id || c.ticketId.toLowerCase() === id.toLowerCase());
      if (idx !== -1) {
        const item = memoryComplaints[idx];
        if (citizen) item.citizen = { ...item.citizen, ...citizen };
        if (placeDetails) item.placeDetails = { ...item.placeDetails, ...placeDetails };
        if (problemType) item.problemType = problemType;
        if (subject) item.subject = subject;
        if (description) item.description = description;
        if (reliefNeeded) item.reliefNeeded = reliefNeeded;
        if (priority) item.priority = priority;
        if (status) item.status = status;
        if (assignedDepartment !== undefined) item.assignedDepartment = assignedDepartment;
        if (adminRemarks !== undefined) item.adminRemarks = adminRemarks;
        if (rejectionReason !== undefined) item.rejectionReason = rejectionReason;
        item.actionHistory = [...(item.actionHistory || []), actionEntry];
        item.updatedAt = new Date();
        updatedComplaint = item;
      }
    }

    if (!updatedComplaint) {
      return res.status(404).json({ success: false, message: 'অভিযোগ পাওয়া যায়নি।' });
    }

    return res.json({
      success: true,
      message: `টিকিট ${updatedComplaint.ticketId} সফলভাবে সম্পূর্ণ সম্পাদন (Edit) করা হয়েছে।`,
      data: updatedComplaint
    });
  } catch (err) {
    console.error('Error during full complaint edit:', err);
    return res.status(500).json({ success: false, message: 'Server error updating complaint: ' + err.message });
  }
});

// Admin Delete Complaint
app.delete('/api/admin/complaints/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let deleted;

    if (getDbStatus()) {
      deleted = await Complaint.findOneAndDelete({
        $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { ticketId: id }]
      });
    } else {
      const index = memoryComplaints.findIndex(c => c._id === id || c.ticketId.toLowerCase() === id.toLowerCase());
      if (index !== -1) {
        deleted = memoryComplaints.splice(index, 1)[0];
      }
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Complaint not found.' });
    }

    return res.json({ success: true, message: 'Complaint deleted successfully.' });
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return res.status(500).json({ success: false, message: 'Server error deleting complaint.' });
  }
});

// Export all complaints for administrative reporting
app.get('/api/admin/export', async (req, res) => {
  try {
    let complaints = [];
    if (getDbStatus()) {
      complaints = await Complaint.find({}).sort({ createdAt: -1 }).lean();
    } else {
      complaints = memoryComplaints;
    }

    return res.json({
      success: true,
      exportDate: new Date().toISOString(),
      constituency: CONSTITUENCY_NAME,
      mla: MLA_NAME,
      totalCount: complaints.length,
      data: complaints
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error exporting data.' });
  }
});

// Serve frontend build in production / Render
const fs = require('fs');
const frontendDistPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  console.log(`📦 Serving static frontend from: ${frontendDistPath}`);
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Start Express Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🏛️  Bidhayak Seva Kendra Backend is running!`);
  console.log(`📍 Constituency: ${CONSTITUENCY_NAME}`);
  console.log(`🌐 Server Port: http://localhost:${PORT}`);
  console.log(`🔑 Admin Login: ${ADMIN_EMAIL} (Password: ${ADMIN_PASSWORD})`);
  console.log(`📱 Citizen Phone & OTP Auth System Active!`);
  console.log(`=======================================================`);
});

module.exports = app;
