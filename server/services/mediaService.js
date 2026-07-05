const axios = require('axios');
const { env } = require('../config/env');

async function descargarMediaTwilio(url) {
  const auth = Buffer.from(`${env.twilioAccountSid}:${env.twilioAuthToken}`).toString('base64');
  const respuesta = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { Authorization: `Basic ${auth}` },
  });
  return Buffer.from(respuesta.data);
}

module.exports = { descargarMediaTwilio };
