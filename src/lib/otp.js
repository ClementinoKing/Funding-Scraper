const OTP_STORAGE_KEY = 'otp_codes'
const OTP_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Generate a 6-digit OTP code
 * @returns {string} 6-digit OTP code
 */
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Store OTP code for a phone number
 * @param {string} phone - Phone number (normalized)
 * @param {string} otp - OTP code
 */
export function storeOTP(phone, otp) {
  try {
    const stored = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}')
    stored[phone] = {
      code: otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
    }
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(stored))
    
    // Log OTP to console for testing (mock implementation)
    console.log(`[OTP] Code for ${phone}: ${otp} (expires in 5 minutes)`)
  } catch (error) {
    console.error('Error storing OTP:', error)
  }
}

/**
 * Verify OTP code for a phone number
 * @param {string} phone - Phone number (normalized)
 * @param {string} otp - OTP code to verify
 * @returns {boolean} True if OTP is valid and not expired
 */
export function verifyOTP(phone, otp) {
  try {
    const stored = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}')
    const otpData = stored[phone]
    
    if (!otpData) {
      return false
    }
    
    // Check if expired
    if (Date.now() > otpData.expiresAt) {
      // Clean up expired OTP
      delete stored[phone]
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(stored))
      return false
    }
    
    // Verify code matches
    if (otpData.code !== otp) {
      return false
    }
    
    // OTP is valid - clean it up after successful verification
    delete stored[phone]
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(stored))
    
    return true
  } catch (error) {
    console.error('Error verifying OTP:', error)
    return false
  }
}

/**
 * Check if OTP exists and is not expired for a phone number
 * @param {string} phone - Phone number (normalized)
 * @returns {boolean} True if OTP exists and is valid
 */
export function hasValidOTP(phone) {
  try {
    const stored = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}')
    const otpData = stored[phone]
    
    if (!otpData) {
      return false
    }
    
    if (Date.now() > otpData.expiresAt) {
      // Clean up expired OTP
      delete stored[phone]
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(stored))
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * Clear OTP for a phone number
 * @param {string} phone - Phone number (normalized)
 */
export function clearOTP(phone) {
  try {
    const stored = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}')
    delete stored[phone]
    localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    console.error('Error clearing OTP:', error)
  }
}

/**
 * Clean up expired OTPs
 */
export function cleanupExpiredOTPs() {
  try {
    const stored = JSON.parse(localStorage.getItem(OTP_STORAGE_KEY) || '{}')
    const now = Date.now()
    let cleaned = false
    
    for (const phone in stored) {
      if (stored[phone].expiresAt < now) {
        delete stored[phone]
        cleaned = true
      }
    }
    
    if (cleaned) {
      localStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(stored))
    }
  } catch (error) {
    console.error('Error cleaning up expired OTPs:', error)
  }
}


