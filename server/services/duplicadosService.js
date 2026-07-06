const REGEX_SUFIJOS = [/\s*\(cuota \d+\/\d+\)\s*$/i, /\s*\(d[eé]bito autom[aá]tico\)\s*$/i];

function normalizarDescripcion(descripcion) {
  let texto = (descripcion || '').trim();
  REGEX_SUFIJOS.forEach((regex) => {
    texto = texto.replace(regex, '');
  });
  return texto.trim().toUpperCase();
}

function buscarGastoDuplicado({ descripcion, monto, mes }, gastos) {
  const descNormalizada = normalizarDescripcion(descripcion);
  if (!descNormalizada) return null;

  return (
    gastos.find((g) => {
      const mismoMes = (g.fecha || '').slice(0, 7) === mes;
      const mismoMonto = Math.abs(g.monto - monto) < 1;
      const mismaDescripcion = normalizarDescripcion(g.descripcion) === descNormalizada;
      return mismoMes && mismoMonto && mismaDescripcion;
    }) || null
  );
}

module.exports = { normalizarDescripcion, buscarGastoDuplicado };
