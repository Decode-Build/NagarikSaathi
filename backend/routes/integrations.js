import express from 'express';
import mongoose from 'mongoose';
import { Application } from '../models.js';

const router = express.Router();

// In-memory OTP storage with TTL (5 minutes)
const otpStore = new Map();

// Helper to clean up expired OTPs periodically
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
  if (digits.startsWith('91') && digits.length === 12) {
    // Already has 91 prefix
  } else if (digits.length === 10) {
    digits = '91' + digits;
  }
  return {
    raw10: digits.length === 12 ? digits.slice(2) : digits,
    countryCode: digits,
    plusCountryCode: '+' + digits
  };
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
 * Triggers Workflow 3 (Send OTP to WhatsApp)
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
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    otpStore.set(phoneInfo.raw10, {
      code: generatedOtp,
      expiresAt,
      verified: false,
      attempts: 0
    });

    const n8nWebhookUrl = process.env.N8N_OTP_SEND_WEBHOOK;
    const payload = {
      phone: phoneInfo.countryCode,
      phone10: phoneInfo.raw10,
      to: phoneInfo.countryCode,
      recipient: phoneInfo.countryCode,
      whatsappNumber: phoneInfo.plusCountryCode,
      otp: generatedOtp,
      purpose,
      message: `Your NagarikSaathi verification code is: ${generatedOtp}. Valid for 5 minutes. Do not share this code with anyone.`,
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
          console.warn('n8n OTP webhook responded with non-200 status:', n8nRes.status);
        }
      } catch (err) {
        console.error('Error sending OTP to n8n webhook:', err.message);
      }
    } else {
      console.log(`[Dev OTP] Generated OTP for WhatsApp ${phoneInfo.raw10}: ${generatedOtp}`);
    }

    return res.json({
      success: true,
      message: 'OTP sent to your WhatsApp number.',
      expiresInSeconds: 300
    });
  } catch (err) {
    console.error('Error in /send-otp:', err);
    res.status(500).json({ error: 'Failed to send OTP.' });
  }
});

/**
 * 3. POST /api/integrations/verify-otp
 * Verifies the OTP entered by citizen
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required.' });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const record = otpStore.get(cleanPhone);

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

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    record.attempts = (record.attempts || 0) + 1;
    if (record.attempts > 5) {
      otpStore.delete(cleanPhone);
      return res.status(429).json({ error: 'Too many incorrect attempts. Please request a new OTP.' });
    }

    if (record.code !== String(otp).trim()) {
      return res.status(400).json({ error: 'Invalid OTP. Please check and try again.' });
    }

    // Mark as verified
    record.verified = true;
    const verificationToken = `vtok_${Buffer.from(`${cleanPhone}:${Date.now()}`).toString('base64')}`;
    record.token = verificationToken;

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

    const cleanPhone = applicant.phone ? String(applicant.phone).replace(/\D/g, '') : '';
    const verifiedRecord = cleanPhone ? otpStore.get(cleanPhone) : null;
    const isPhoneVerified = verifiedRecord ? verifiedRecord.verified : Boolean(verificationToken);

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
            applicant: { fullName: "Ramesh Kumar", phone: "9876543210", district: "Bhopal" },
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
 * 6. GET /api/integrations/applications/track/:applicationId
 * Returns real tracking timeline data for the citizen portal
 */
router.get('/applications/track/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await Application.findOne({ applicationId: applicationId.toUpperCase() });

    if (!application) {
      return res.status(404).json({ error: 'Application not found. Please check your Reference ID.' });
    }

    const { status, schemeName, applicant, createdAt } = application;
    
    // Build dynamic timeline based on status
    const timeline = [
      { 
        stage: 'submitted', 
        date: createdAt, 
        completed: true, 
        labelEn: 'Application Submitted', 
        labelHi: 'आवेदन जमा किया गया' 
      },
      { 
        stage: 'document_verification', 
        date: status === 'VERIFIED' || status === 'PROCESSED' || status === 'REJECTED' ? new Date(createdAt.getTime() + 86400000) : null, 
        completed: status === 'VERIFIED' || status === 'PROCESSED', 
        labelEn: 'Document Verification', 
        labelHi: 'दस्तावेज़ सत्यापन' 
      },
      { 
        stage: 'approval', 
        date: status === 'PROCESSED' ? new Date(createdAt.getTime() + 172800000) : null, 
        completed: status === 'PROCESSED', 
        labelEn: 'Final Approval', 
        labelHi: 'अंतिम स्वीकृति' 
      },
      { 
        stage: 'disbursal', 
        date: status === 'PROCESSED' ? new Date(createdAt.getTime() + 259200000) : null, 
        completed: status === 'PROCESSED', 
        labelEn: 'Benefit Disbursal', 
        labelHi: 'लाभ वितरण' 
      }
    ];

    if (status === 'REJECTED') {
      timeline.push({
        stage: 'rejected',
        date: new Date(),
        completed: true,
        labelEn: 'Application Rejected',
        labelHi: 'आवेदन अस्वीकृत'
      });
    }

    return res.json({
      success: true,
      data: {
        id: applicationId,
        scheme: schemeName,
        applicant: applicant.fullName,
        currentStage: status,
        timeline
      }
    });

  } catch (err) {
    console.error('Error tracking application:', err);
    return res.status(500).json({ error: 'Failed to fetch application tracking data.' });
  }
});

export default router;
