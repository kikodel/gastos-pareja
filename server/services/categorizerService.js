const { CATEGORIAS, ORDEN_CATEGORIAS } = require('../config/categorias');

function quitarTildes(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function normalizarParaComparar(texto) {
  return quitarTildes((texto || '').toLowerCase()).replace(/[\s-]+/g, '');
}

function categorizar(descripcion) {
  const texto = normalizarParaComparar(descripcion);
  for (const categoria of ORDEN_CATEGORIAS) {
    const keywords = CATEGORIAS[categoria];
    if (keywords.some((kw) => texto.includes(normalizarParaComparar(kw)))) {
      return categoria;
    }
  }
  return 'Otros';
}

module.exports = { categorizar };
