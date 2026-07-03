const { CATEGORIAS, ORDEN_CATEGORIAS } = require('../config/categorias');

function quitarTildes(texto) {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function categorizar(descripcion) {
  const texto = quitarTildes((descripcion || '').toLowerCase());
  for (const categoria of ORDEN_CATEGORIAS) {
    const keywords = CATEGORIAS[categoria];
    if (keywords.some((kw) => texto.includes(kw))) {
      return categoria;
    }
  }
  return 'Otros';
}

module.exports = { categorizar };
