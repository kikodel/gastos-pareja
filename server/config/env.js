const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

function parseGruposJson(raw) {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`GRUPOS_JSON no es un JSON valido: ${err.message}`);
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  publicBaseUrl: process.env.PUBLIC_BASE_URL || '',
  validateTwilioSignature: process.env.VALIDATE_TWILIO_SIGNATURE === 'true',

  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioWhatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '',

  googleServiceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
  googleServiceAccountPrivateKey: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || '').replace(/\\n/g, '\n'),

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  grupos: parseGruposJson(process.env.GRUPOS_JSON),
};

module.exports = { env, requireEnv };
