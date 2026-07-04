const Anthropic = require('@anthropic-ai/sdk');
const { env } = require('../config/env');

function crearCliente() {
  return new Anthropic({ apiKey: env.anthropicApiKey });
}

module.exports = { crearCliente };
