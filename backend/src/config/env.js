const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_sahakar_seva_2026_coop',
  
  // AI Service Keys
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  
  // Geocoding Keys
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  
  // Payment Keys
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
  
  // Voice / Multilingual
  BHASHINI_API_KEY: process.env.BHASHINI_API_KEY || '',
  BHASHINI_USER_ID: process.env.BHASHINI_USER_ID || '',
  
  // SMS / IVR
  SMS_GATEWAY_API_KEY: process.env.SMS_GATEWAY_API_KEY || '',
  
  // DB File Path
  DB_PATH: path.resolve(__dirname, '../../instacoserve.db')
};
