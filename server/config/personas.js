const { env } = require('./env');

function resolverPersona(fromWhatsapp, profileName) {
  return env.personasMap[fromWhatsapp] || profileName || 'Desconocido';
}

module.exports = { resolverPersona };
