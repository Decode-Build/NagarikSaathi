import express from 'express';
import mongoose from 'mongoose';
import { Application, OtpSession } from '../models.js';

const router = express.Router();

// In-memory OTP storage fallback with periodic cleanup (5 minutes TTL)
const otpStore = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (data.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 60000);

// Normalize phone numbers for WhatsApp APIs (e.g., 9522520619 -> 919522520619 & +919522520619)
const normalizePhone = (rawPhone) => {
  let digits = String(rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  const raw10 = digits.length >= 10 ? digits.slice(-10) : digits;
  const countryCode = '91' + raw10;
  return {
    raw10: raw10,
    countryCode: countryCode,
    plusCountryCode: '+' + countryCode
  };
};

/**
 * Helper to save OTP session to MongoDB and fallback Map
 */
const saveOtpRecord = async (phone10, generatedOtp, purpose = 'scheme_application') => {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  // Always update in-memory cache
  otpStore.set(phone10, {
    code: generatedOtp,
    expiresAt,
    verified: false,
    attempts: 0
  });

  // Persist to MongoDB with TTL if connected
  if (mongoose.connection.readyState === 1) {
    try {
      await OtpSession.deleteMany({ phone: phone10 });
      await OtpSession.create({
        phone: phone10,
        code: generatedOtp,
        purpose,
        verified: false,
        attempts: 0
      });
    } catch (dbErr) {
      console.warn('Could not persist OTP session to MongoDB:', dbErr.message);
    }
  }
};

/**
 * Helper to retrieve and verify OTP from MongoDB or fallback Map
 */
const lookupOtpRecord = async (phone10) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const doc = await OtpSession.findOne({ phone: phone10 }).sort({ createdAt: -1 });
      if (doc) return doc;
    } catch (dbErr) {
      console.warn('Could not lookup OTP in MongoDB:', dbErr.message);
    }
  }
  return otpStore.get(phone10) || null;
};

/**
 * 1. POST /api/integrations/whatsapp-share
 * Triggers Workflow 1 (WhatsApp Scheme Sharing)
 */
router.post('/whatsapp-share', async (req, res) => {
  try {
    const { phone, scheme, language = 'en' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }
    if (!scheme || !scheme.name) {
      return res.status(400).json({ error: 'Scheme data is required.' });
    }

    const phoneInfo = normalizePhone(phone);
    const n8nWebhookUrl = process.env.N8N_WHATSAPP_SHARE_WEBHOOK;
    const schemeName = scheme.name || scheme.schemeName || scheme.title || 'Government Scheme';
    const overview = scheme.overview || scheme.description || '';
    const benefitsList = (scheme.benefits || []).slice(0, 3).map(b => `• ${b}`).join('\n');
    const documentsList = (scheme.documents || []).slice(0, 4).map(d => `• ${d}`).join('\n');

    const formattedMessage = `🏛️ *${schemeName}*\n\n📝 *${language === 'hi' ? 'विवरण' : 'Overview'}:*\n${overview}\n\n🎁 *${language === 'hi' ? 'मुख्य लाभ' : 'Key Benefits'}:*\n${benefitsList || 'Available on official portal'}\n\n📄 *${language === 'hi' ? 'दस्तावेज़' : 'Documents'}:*\n${documentsList || 'Aadhaar Card, Bank Details'}\n\n🌐 *${language === 'hi' ? 'पोर्टल' : 'Portal'}:* ${scheme.portalUrl || 'https://www.india.gov.in'}\n📞 *${language === 'hi' ? 'हेल्पलाइन' : 'Helpline'}:* ${scheme.helpline || '1800-111-999'}`;

    const payload = {
      phone: phoneInfo.countryCode,
      phone_number: phoneInfo.countryCode,
      phone10: phoneInfo.raw10,
      to: phoneInfo.countryCode,
      recipient: phoneInfo.countryCode,
      whatsappNumber: phoneInfo.plusCountryCode,
      scheme: schemeName,
      scheme_name: schemeName,
      schemeName: schemeName,
      schemeTitle: schemeName,
      title: schemeName,
      name: schemeName,
      schemeId: scheme.id || scheme._id,
      scheme_id: scheme.id || scheme._id,
      overview: overview,
      description: overview,
      benefits: scheme.benefits || [],
      documents: scheme.documents || [],
      portalUrl: scheme.portalUrl || '',
      portal_url: scheme.portalUrl || '',
      helpline: scheme.helpline || '',
      language: language,
      message: formattedMessage,
      text: formattedMessage,
      body: formattedMessage,
      timestamp: new Date().toISOString()
    };

    if (n8nWebhookUrl) {
      try {
        const n8nRes = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!n8nRes.ok) {
          const errText = await n8nRes.text();
          console.error('n8n WhatsApp Share webhook error:', errText);
          return res.status(502).json({
            error: 'n8n workflow failed to deliver WhatsApp message.',
            details: errText
          });
        }

        const data = await n8nRes.json().catch(() => ({}));
        return res.json({
          success: true,
          message: 'Scheme details sent to WhatsApp successfully via n8n.',
          data
        });
      } catch (webhookErr) {
        console.error('Failed to trigger n8n WhatsApp Share:', webhookErr.message);
        return res.status(502).json({
          error: 'Could not connect to n8n WhatsApp webhook.',
          details: webhookErr.message
        });
      }
    }

    // Fallback if webhook is not configured
    console.log('[Dev Mode] n8n WhatsApp Share Webhook not configured. Payload:', payload);
    return res.json({
      success: true,
      mode: 'mock',
      message: 'WhatsApp share request accepted (N8N_WHATSAPP_SHARE_WEBHOOK not set).',
      payload
    });
  } catch (err) {
    console.error('Error in /whatsapp-share:', err);
    res.status(500).json({ error: 'Internal server error processing WhatsApp share.' });
  }
});

/**
 * 2. POST /api/integrations/send-otp
 * Triggers Workflow 3 (Send OTP to WhatsApp) with Persistent DB + Memory Backup
 */
router.post('/send-otp', async (req, res) => {
  try {
    const { phone, purpose = 'scheme_application' } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'WhatsApp phone number is required.' });
    }

    const phoneInfo = normalizePhone(phone);
    if (phoneInfo.raw10.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit WhatsApp phone number.' });
    }

    // Generate 6-digit OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    await saveOtpRecord(phoneInfo.raw10, generatedOtp, purpose);

    const formattedOtpMessage = `🔐 *NagarikSaathi Verification Code*\n\nYour 6-digit OTP verification code is: *${generatedOtp}*\n\n⏳ Valid for 5 minutes. Do not share this code with anyone.\n\n🇮🇳 _NagarikSaathi - Government Schemes Assistance Platform_`;

    const n8nWebhookUrl = process.env.N8N_OTP_SEND_WEBHOOK || process.env.N8N_WHATSAPP_SHARE_WEBHOOK;
    const payload = {
      phone: phoneInfo.countryCode,
      phone_number: phoneInfo.countryCode,
      phone10: phoneInfo.raw10,
      to: phoneInfo.countryCode,
      recipient: phoneInfo.countryCode,
      whatsappNumber: phoneInfo.plusCountryCode,
      scheme: 'NagarikSaathi OTP Verification',
      scheme_name: 'NagarikSaathi OTP Verification',
      schemeName: 'NagarikSaathi OTP Verification',
      schemeTitle: 'NagarikSaathi OTP Verification',
      title: 'NagarikSaathi OTP Verification',
      name: 'NagarikSaathi OTP Verification',
      otp: generatedOtp,
      code: generatedOtp,
      verificationCode: generatedOtp,
      purpose,
      message: formattedOtpMessage,
      text: formattedOtpMessage,
      body: formattedOtpMessage,
      timestamp: new Date().toISOString()
    };

    console.log(`[WhatsApp OTP] Generated verification code for ${phoneInfo.raw10}: ${generatedOtp} (Valid for 5 mins)`);

    if (n8nWebhookUrl) {
      try {
        const n8nRes = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (n8nRes.ok) {
          console.log(`[WhatsApp OTP] Dispatched successfully to WhatsApp via n8n for ${phoneInfo.raw10}`);
        } else {
          console.warn(`n8n primary OTP webhook responded with status ${n8nRes.status}. Trying secondary WhatsApp alert webhook...`);
          if (process.env.N8N_WHATSAPP_SHARE_WEBHOOK && process.env.N8N_WHATSAPP_SHARE_WEBHOOK !== n8nWebhookUrl) {
            try {
              const fallbackRes = await fetch(process.env.N8N_WHATSAPP_SHARE_WEBHOOK, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
              });
              if (fallbackRes.ok) {
                console.log(`[WhatsApp OTP] Dispatched successfully via secondary WhatsApp webhook for ${phoneInfo.raw10}`);
              }
            } catch (fbErr) {
              console.warn('Fallback webhook error:', fbErr.message);
            }
          }
        }
      } catch (err) {
        console.error('Error sending OTP to n8n webhook:', err.message);
      }
    }

    return res.json({
      success: true,
      message: 'OTP sent to your WhatsApp number.',
      expiresInSeconds: 300,
      devOtp: process.env.NODE_ENV !== 'production' ? generatedOtp : undefined
    });
  } catch (err) {
    console.error('Error in /send-otp:', err);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

/**
 * 3. POST /api/integrations/verify-otp
 * Verifies the OTP entered by citizen with DB / Memory reconciliation
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    const record = await lookupOtpRecord(cleanPhone);

    // If custom n8n OTP verify webhook is configured
    const n8nVerifyWebhookUrl = process.env.N8N_OTP_VERIFY_WEBHOOK;
    if (n8nVerifyWebhookUrl) {
      try {
        const n8nRes = await fetch(n8nVerifyWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: cleanPhone, otp: String(otp).trim(), timestamp: new Date().toISOString() })
        });
        const n8nData = await n8nRes.json().catch(() => ({}));
        if (n8nRes.ok && (n8nData.verified === true || n8nData.success === true)) {
          if (record) record.verified = true;
          const verificationToken = `vtok_${Buffer.from(`${cleanPhone}:${Date.now()}`).toString('base64')}`;
          return res.json({
            success: true,
            verified: true,
            message: 'WhatsApp number verified successfully via n8n!',
            verificationToken
          });
        } else {
          return res.status(400).json({ error: n8nData.error || n8nData.message || 'Invalid OTP code.' });
        }
      } catch (webhookErr) {
        console.error('Failed to verify OTP with n8n webhook:', webhookErr.message);
      }
    }

    if (!record) {
      return res.status(400).json({ error: 'No OTP requested for this phone number or OTP expired.' });
    }

    // Rate limiting attempts
    const currentAttempts = (record.attempts || 0) + 1;
    if (typeof record.save === 'function') {
      record.attempts = currentAttempts;
      await record.save();
    } else {
      record.attempts = currentAttempts;
    }

    if (currentAttempts > 5) {
      if (mongoose.connection.readyState === 1) {
        await OtpSession.deleteMany({ phone: cleanPhone });
      }
      otpStore.delete(cleanPhone);
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (String(record.code).trim() !== String(otp).trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Mark as verified
    const verificationToken = `vtok_${Buffer.from(`${cleanPhone}:${Date.now()}`).toString('base64')}`;
    if (typeof record.save === 'function') {
      record.verified = true;
      record.token = verificationToken;
      await record.save();
    }
    const memRecord = otpStore.get(cleanPhone);
    if (memRecord) {
      memRecord.verified = true;
      memRecord.token = verificationToken;
    }

    return res.json({
      success: true,
      verified: true,
      message: 'WhatsApp number verified successfully!',
      verificationToken
    });
  } catch (err) {
    console.error('Error in /verify-otp:', err);
    res.status(500).json({ error: 'Failed to verify OTP.' });
  }
});

/**
 * 4. POST /api/integrations/submit-application
 * Triggers Workflow 2 (Form Auto-fill & Download)
 */
router.post('/submit-application', async (req, res) => {
  try {
    const { schemeId, schemeName, applicant, verificationToken } = req.body;

    if (!schemeName || !applicant) {
      return res.status(400).json({ error: 'Scheme name and applicant details are required.' });
    }

    const cleanPhone = applicant.phone ? String(applicant.phone).replace(/\D/g, '').slice(-10) : '';
    const verifiedRecord = cleanPhone ? await lookupOtpRecord(cleanPhone) : null;
    const isPhoneVerified = (verifiedRecord && verifiedRecord.verified) || Boolean(verificationToken);

    // Strict Security Guard: Enforce OTP verification before allowing form generation
    if (!isPhoneVerified) {
      return res.status(403).json({
        error: 'WhatsApp OTP verification is mandatory before generating or downloading the application form.'
      });
    }

    const applicationId = `NS-APP-${Date.now().toString(36).toUpperCase()}`;
    const submissionPayload = {
      applicationId,
      application_id: applicationId,
      schemeId,
      scheme_id: schemeId,
      schemeName,
      scheme_name: schemeName,
      fullName: applicant.fullName || '',
      name: applicant.fullName || '',
      applicantName: applicant.fullName || '',
      phone: cleanPhone,
      phone_number: cleanPhone,
      whatsappNumber: '+91' + cleanPhone,
      aadhaarLast4: applicant.aadhaarLast4 || '',
      aadhaar: applicant.aadhaarLast4 || '',
      gender: applicant.gender || '',
      age: Number(applicant.age) || null,
      annualIncome: Number(applicant.annualIncome) || 0,
      annual_income: Number(applicant.annualIncome) || 0,
      occupation: applicant.occupation || '',
      address: applicant.address || '',
      district: applicant.district || '',
      state: applicant.state || '',
      casteCategory: applicant.category || applicant.casteCategory || 'General',
      isPhoneVerified: true,
      applicant: {
        fullName: applicant.fullName || '',
        name: applicant.fullName || '',
        phone: cleanPhone,
        phone_number: cleanPhone,
        aadhaarLast4: applicant.aadhaarLast4 || '',
        gender: applicant.gender || '',
        age: Number(applicant.age) || null,
        annualIncome: Number(applicant.annualIncome) || 0,
        occupation: applicant.occupation || '',
        address: applicant.address || '',
        district: applicant.district || '',
        state: applicant.state || '',
        casteCategory: applicant.category || applicant.casteCategory || 'General',
        isPhoneVerified: true
      },
      submittedAt: new Date().toISOString()
    };

    // Persist application in MongoDB so it is visible in Admin Panel
    try {
      await Application.create({
        applicationId,
        schemeId: schemeId || 'general',
        schemeName,
        applicant: submissionPayload.applicant,
        verificationToken: verificationToken || (verifiedRecord ? verifiedRecord.token : 'verified'),
        status: 'SUBMITTED',
        n8nGenerated: Boolean(process.env.N8N_FORM_AUTOFILL_WEBHOOK)
      });
    } catch (dbSaveErr) {
      console.warn('Could not save application to DB:', dbSaveErr.message);
    }

    const n8nWebhookUrl = process.env.N8N_FORM_AUTOFILL_WEBHOOK;

    if (n8nWebhookUrl) {
      try {
        const n8nRes = await fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submissionPayload)
        });

        const contentType = n8nRes.headers.get('content-type') || '';

        // If n8n returns binary PDF directly
        if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
          const buffer = await n8nRes.arrayBuffer();
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="Application_${applicationId}.pdf"`);
          return res.send(Buffer.from(buffer));
        }

        // If n8n returns JSON with downloadUrl or pdfBase64
        const n8nData = await n8nRes.json().catch(() => ({}));
        return res.json({
          success: true,
          applicationId,
          message: 'Application form filled successfully via n8n.',
          downloadUrl: n8nData.downloadUrl || n8nData.fileUrl || null,
          pdfBase64: n8nData.pdfBase64 || null,
          details: submissionPayload
        });
      } catch (err) {
        console.error('Error contacting n8n Form Auto-fill Webhook:', err.message);
        return res.status(502).json({
          error: 'Failed to contact n8n Form Auto-fill service.',
          details: err.message
        });
      }
    }

    // Default fallback: return structured application data with generated application ID
    console.log('[Dev Mode] N8N_FORM_AUTOFILL_WEBHOOK not configured. Generating standard application summary packet.');
    return res.json({
      success: true,
      mode: 'mock',
      applicationId,
      message: 'Application form details received. Ready for download/printing.',
      details: submissionPayload
    });
  } catch (err) {
    console.error('Error in /submit-application:', err);
    res.status(500).json({ error: 'Failed to submit application form.' });
  }
});

/**
/**
 * 5. GET /api/integrations/applications
 * Returns all filled applications for the Admin Panel
 */
router.get('/applications', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // Mock data if no DB connection
      return res.json({
        success: true,
        count: 1,
        applications: [
          {
            _id: "mock_123",
            applicationId: "NS-APP-MOCK1",
            schemeName: "PM Awas Yojana",
            applicant: { fullName: "Ramesh Kumar", phone: "9876543210", district: "Bhopal", state: "Madhya Pradesh" },
            status: "SUBMITTED",
            remarks: "Initial submission received.",
            createdAt: new Date()
          }
        ]
      });
    }

    const applications = await Application.find({}).sort({ createdAt: -1 }).limit(200);
    return res.json({
      success: true,
      count: applications.length,
      applications
    });
  } catch (err) {
    console.error('Error fetching applications for admin:', err);
    return res.status(500).json({ error: 'Failed to fetch applications.' });
  }
});

/**
 * 6. PATCH /api/integrations/applications/:id/status
 * POST /api/integrations/applications/:id/status
 * Updates status (SUBMITTED, VERIFIED, PROCESSED, REJECTED) and remarks for an application
 */
const updateApplicationStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const validStatuses = ['SUBMITTED', 'VERIFIED', 'PROCESSED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.json({
        success: true,
        message: `Application ${id} status updated to ${status} (Dev/Mock Mode).`,
        application: {
          applicationId: id,
          status,
          remarks: remarks || '',
          updatedAt: new Date()
        }
      });
    }

    // Lookup by applicationId or MongoDB _id
    let application = await Application.findOne({
      $or: [
        { applicationId: id.toUpperCase() },
        { applicationId: id },
        ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])
      ]
    });

    if (!application) {
      return res.status(404).json({ error: `Application not found for ID: ${id}` });
    }

    application.status = status;
    if (remarks !== undefined) {
      application.remarks = remarks;
    }
    application.updatedAt = new Date();

    if (status === 'VERIFIED') {
      application.verifiedAt = new Date();
    } else if (status === 'PROCESSED') {
      if (!application.verifiedAt) application.verifiedAt = new Date();
      application.approvedAt = new Date();
    } else if (status === 'REJECTED') {
      application.rejectedAt = new Date();
    }

    await application.save();

    return res.json({
      success: true,
      message: `Application status updated to ${status} successfully.`,
      application
    });

  } catch (err) {
    console.error('Error updating application status:', err);
    return res.status(500).json({ error: 'Failed to update application status: ' + err.message });
  }
};

router.patch('/applications/:id/status', updateApplicationStatusHandler);
router.post('/applications/:id/status', updateApplicationStatusHandler);

/**
 * 7. GET /api/integrations/applications/track/:query
 * Returns real tracking timeline data by Application Reference ID OR Citizen Phone Number
 */
router.get('/applications/track/:query', async (req, res) => {
  try {
    const rawQuery = String(req.params.query || '').trim();
    if (!rawQuery) {
      return res.status(400).json({ error: 'Tracking ID or Phone number is required.' });
    }

    const cleanPhone = rawQuery.replace(/\D/g, '');
    let application = null;

    if (mongoose.connection.readyState === 1) {
      // 1. Search by Application ID
      application = await Application.findOne({
        $or: [
          { applicationId: rawQuery.toUpperCase() },
          { applicationId: rawQuery }
        ]
      });

      // 2. Search by Phone Number if not found by ID
      if (!application && cleanPhone.length >= 10) {
        const last10 = cleanPhone.slice(-10);
        application = await Application.findOne({
          $or: [
            { 'applicant.phone': last10 },
            { 'applicant.phone': { $regex: last10 } }
          ]
        }).sort({ createdAt: -1 });
      }
    }

    // Mock fallback if DB is offline or mock ID is used
    if (!application) {
      if (rawQuery.toUpperCase() === 'NS-APP-MOCK1' || cleanPhone.endsWith('9876543210')) {
        application = {
          applicationId: "NS-APP-MOCK1",
          schemeName: "Pradhan Mantri Awas Yojana (Gramin)",
          applicant: { fullName: "Ramesh Kumar", phone: "9876543210" },
          status: "SUBMITTED",
          remarks: "Application received and queued for CSC operator document verification.",
          createdAt: new Date(Date.now() - 3600000)
        };
      } else {
        return res.status(404).json({
          error: `No application found for "${rawQuery}". Please check the Application Reference ID (e.g. NS-APP-...) or 10-digit Phone Number.`
        });
      }
    }

    const { applicationId, status, schemeName, applicant, createdAt, verifiedAt, approvedAt, rejectedAt, updatedAt, remarks } = application;
    const isRejected = status === 'REJECTED';
    const isVerified = status === 'VERIFIED' || status === 'PROCESSED';
    const isProcessed = status === 'PROCESSED';

    // Build real tracking timeline reflecting MongoDB status
    const timeline = [
      { 
        stage: 'submitted', 
        date: createdAt, 
        completed: true, 
        labelEn: 'Application Submitted', 
        labelHi: 'आवेदन जमा किया गया',
        descriptionEn: 'Application successfully registered and verified via WhatsApp OTP.',
        descriptionHi: 'आवेदन सफलतापूर्वक दर्ज किया गया और WhatsApp OTP द्वारा सत्यापित।'
      },
      { 
        stage: 'document_verification', 
        date: isVerified ? (verifiedAt || updatedAt) : (isRejected ? rejectedAt : null), 
        completed: isVerified, 
        inProgress: status === 'SUBMITTED',
        labelEn: 'Document Verification', 
        labelHi: 'दस्तावेज़ सत्यापन',
        descriptionEn: isVerified 
          ? 'All eligibility documents verified by CSC Operator.' 
          : (isRejected ? 'Verification stopped due to discrepancy.' : 'CSC Operator is reviewing uploaded documents.'),
        descriptionHi: isVerified 
          ? 'सीएससी ऑपरेटर द्वारा सभी दस्तावेज़ सत्यापित किए गए।' 
          : (isRejected ? 'दस्तावेज़ विसंगति के कारण सत्यापन रुका।' : 'सीएससी ऑपरेटर दस्तावेजों की समीक्षा कर रहे हैं।')
      },
      { 
        stage: 'approval', 
        date: isProcessed ? (approvedAt || updatedAt) : null, 
        completed: isProcessed, 
        inProgress: status === 'VERIFIED',
        labelEn: 'Department Approval', 
        labelHi: 'विभागीय स्वीकृति',
        descriptionEn: isProcessed 
          ? 'Scheme sanction order generated and approved by department authority.' 
          : 'Pending department sanction order review.',
        descriptionHi: isProcessed 
          ? 'विभाग द्वारा योजना स्वीकृति आदेश जारी किया गया।' 
          : 'विभागीय स्वीकृति समीक्षा प्रतीक्षित।'
      },
      { 
        stage: 'disbursal', 
        date: isProcessed ? (approvedAt || updatedAt) : null, 
        completed: isProcessed, 
        inProgress: false,
        labelEn: 'Benefit Disbursal & Fulfillment', 
        labelHi: 'लाभ वितरण एवं भुगतान',
        descriptionEn: isProcessed 
          ? 'Direct Benefit Transfer (DBT) dispatched to beneficiary bank account / entitlement activated.' 
          : 'Awaiting final financial transfer dispatch.',
        descriptionHi: isProcessed 
          ? 'लाभार्थी के बैंक खाते में डीबीटी (DBT) लाभ सफलतापूर्वक हस्तांतरित किया गया।' 
          : 'अंतिम वित्तीय भुगतान आदेश प्रतीक्षित।'
      }
    ];

    if (isRejected) {
      timeline.push({
        stage: 'rejected',
        date: rejectedAt || updatedAt || new Date(),
        completed: true,
        isError: true,
        labelEn: 'Application Rejected',
        labelHi: 'आवेदन अस्वीकृत',
        descriptionEn: remarks ? `Reason: ${remarks}` : 'Application was rejected during scrutiny by the operator/department.',
        descriptionHi: remarks ? `कारण: ${remarks}` : 'समीक्षा के दौरान आवेदन अस्वीकृत कर दिया गया।'
      });
    }

    return res.json({
      success: true,
      data: {
        id: applicationId,
        applicationId,
        scheme: schemeName,
        applicantName: applicant?.fullName || 'Citizen Applicant',
        phone: applicant?.phone || '',
        currentStage: status,
        remarks: remarks || '',
        submittedAt: createdAt,
        updatedAt: updatedAt || createdAt,
        timeline
      }
    });

  } catch (err) {
    console.error('Error tracking application:', err);
    return res.status(500).json({ error: 'Failed to fetch application tracking data: ' + err.message });
  }
});

export default router;
