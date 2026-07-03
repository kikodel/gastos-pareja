const twilio = require('twilio');
const { env } = require('../config/env');

function validateTwilioSignature(req, res, next) {
  if (!env.validateTwilioSignature) {
    return next();
  }

  const signature = req.headers['x-twilio-signature'];
  const url = `${env.publicBaseUrl}${req.originalUrl}`;
  const valid = twilio.validateRequest(env.twilioAuthToken, signature, url, req.body);

  if (!valid) {
    return res.status(403).send('Firma de Twilio invalida');
  }

  return next();
}

module.exports = { validateTwilioSignature };
