const { CATEGORIAS, ORDEN_CATEGORIAS } = require('../config/categorias');
const { crearCliente } = require('./claudeService');
const { env } = require('../config/env');

const MODELO_CATEGORIZACION = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 8000;

function quitarTildes(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizarParaComparar(texto) {
  return quitarTildes((texto || '').toLowerCase()).replace(/[\s-]+/g, '');
}

function categorizarPorPalabrasClave(descripcion) {
  const texto = normalizarParaComparar(descripcion);
  for (const categoria of ORDEN_CATEGORIAS) {
    const keywords = CATEGORIAS[categoria];
    if (keywords.some((kw) => texto.includes(normalizarParaComparar(kw)))) {
      return categoria;
    }
  }
  return null;
}

async function categorizarConIA(descripcion) {
  if (!env.anthropicApiKey) return 'Otros';

  try {
    const cliente = crearCliente();
    const respuesta = await cliente.messages.create(
      {
        model: MODELO_CATEGORIZACION,
        max_tokens: 20,
        system: `Sos un clasificador de gastos familiares argentinos. Dada la descripcion de un gasto, respondé unicamente con el nombre EXACTO de una categoria de esta lista, sin explicacion ni puntuacion adicional: ${ORDEN_CATEGORIAS.join(', ')}.`,
        messages: [{ role: 'user', content: descripcion || '(sin descripcion)' }],
      },
      { timeout: TIMEOUT_MS }
    );

    const texto = (respuesta.content?.[0]?.text || '').trim();
    return ORDEN_CATEGORIAS.includes(texto) ? texto : 'Otros';
  } catch (err) {
    console.error('Error al categorizar con IA (se usa Otros):', err.message);
    return 'Otros';
  }
}

async function categorizar(descripcion) {
  const porPalabraClave = categorizarPorPalabrasClave(descripcion);
  if (porPalabraClave) return porPalabraClave;
  return categorizarConIA(descripcion);
}

module.exports = { categorizar };
