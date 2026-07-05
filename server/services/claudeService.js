const Anthropic = require('@anthropic-ai/sdk');
const { env } = require('../config/env');

function crearCliente() {
  return new Anthropic({ apiKey: env.anthropicApiKey });
}

function extraerTexto(respuesta) {
  const bloque = (respuesta.content || []).find((b) => b.type === 'text');
  return bloque ? bloque.text : '';
}

module.exports = { crearCliente, extraerTexto };
