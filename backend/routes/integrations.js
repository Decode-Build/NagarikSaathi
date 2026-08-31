import express from 'express';

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

    const payload = {
      phone: phoneInfo.countryCode,
      phone10: phoneInfo.raw10,
      to: phoneInfo.countryCode,
      recipient: phoneInfo.countryCode,
      whatsappNumber: phoneInfo.plusCountryCode,
      schemeId: scheme.id || scheme._id,
      schemeName: scheme.name,
      overview: scheme.overview,
      benefits: scheme.benefits || [],
      documents: scheme.documents || [],
      portalUrl: scheme.portalUrl || '',
      helpline: scheme.helpline || '',
      language: language,
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
      console.log(`[Dev OTP] Generated OTP for WhatsApp ${cleanPhone}: ${generatedOtp}`);
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

    const applicationId = `NS-APP-${Date.now().toString(36).toUpperCase()}`;
    const submissionPayload = {
      applicationId,
      schemeId,
      schemeName,
      applicant: {
        fullName: applicant.fullName || '',
        phone: cleanPhone,
        aadhaarLast4: applicant.aadhaarLast4 || '',
        gender: applicant.gender || '',
        age: Number(applicant.age) || null,
        annualIncome: Number(applicant.annualIncome) || 0,
        occupation: applicant.occupation || '',
        address: applicant.address || '',
        district: applicant.district || '',
        state: applicant.state || '',
        casteCategory: applicant.category || applicant.casteCategory || 'General',
        isPhoneVerified
      },
      submittedAt: new Date().toISOString()
    };

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

export default router;
