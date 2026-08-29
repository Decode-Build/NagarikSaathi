// Middleware to enforce zero-storage compliance and DPDP purpose limitation

// Recursively inspect an object/array/value for raw government identity numbers or biometric fields
const containsProhibitedData = (obj) => {
  if (obj === null || obj === undefined) return false;
  
  if (typeof obj === 'string') {
    // Aadhaar check: 12-digit number or formatted 4-4-4 digits
    if (/\b\d{12}\b/.test(obj)) return true;
    if (/\b\d{4}[ -]\d{4}[ -]\d{4}\b/.test(obj)) return true;
    // PAN check: 5 uppercase letters, 4 digits, 1 uppercase letter
    if (/\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/i.test(obj)) return true;
    return false;
  }
  
  if (typeof obj === 'number') {
    // Aadhaar number as a raw integer (100000000000 to 999999999999)
    if (obj >= 100000000000 && obj <= 999999999999) return true;
    return false;
  }
  
  if (Array.isArray(obj)) {
    return obj.some(containsProhibitedData);
  }
  
  if (typeof obj === 'object') {
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const lowerKey = key.toLowerCase();
        // Check for biometric keys
        if (
          lowerKey.includes('fingerprint') ||
          lowerKey.includes('biometric') ||
          lowerKey.includes('iris') ||
          lowerKey.includes('face_template') ||
          lowerKey.includes('facetemplate') ||
          lowerKey.includes('retina')
        ) {
          return true;
        }
        // Recursively check values
        if (containsProhibitedData(obj[key])) {
          return true;
        }
      }
    }
  }
  
  return false;
};

export const zeroStorageComplianceMiddleware = (req, res, next) => {
  if (containsProhibitedData(req.body) || containsProhibitedData(req.query) || containsProhibitedData(req.params)) {
    return res.status(400).json({
      error: "Compliance Block: Transmitting or attempting to persist raw government identity numbers (e.g. Aadhaar, PAN) or biometric fields is prohibited. Use tokenized reference strings (identity_token) and boolean verification flags (is_seeded, identity_status) instead."
    });
  }
  next();
};

export const dpdpPurposeLimitationMiddleware = (req, res, next) => {
  // Ephemeral in-memory processing is active by default for citizen queries, or if header is true
  const hasHeader = req.headers['x-dpdp-purpose-limitation'];
  req.dpdpEphemeral = hasHeader !== undefined ? (hasHeader === 'true') : true;
  next();
};
