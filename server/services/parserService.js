const STOPWORDS = ['gaste', 'gasté', 'pague', 'pagué', 'compre', 'compré', 'gasto', 'pago', 'en', 'de', 'por', 'del', 'al'];

const PALABRAS_PREGUNTA = [
  'cuanto', 'cuánto', 'cuanta', 'cuánta', 'cuantos', 'cuántos', 'cuantas', 'cuántas',
  'como', 'cómo', 'que', 'qué', 'cual', 'cuál', 'cuales', 'cuáles', 'resumen', 'total',
];

const REGEX_MONTO = /\$?\s*([0-9][0-9.,]*)/;

function normalizarMonto(token) {
  const limpio = token.replace(/\s/g, '');
  const lastDot = limpio.lastIndexOf('.');
  const lastComma = limpio.lastIndexOf(',');
  const lastSepIndex = Math.max(lastDot, lastComma);

  if (lastSepIndex === -1) {
    return parseFloat(limpio);
  }

  const decimalDigits = limpio.length - lastSepIndex - 1;
  if (decimalDigits >= 1 && decimalDigits <= 2) {
    const integerPart = limpio.slice(0, lastSepIndex).replace(/[.,]/g, '');
    const decimalPart = limpio.slice(lastSepIndex + 1);
    return parseFloat(`${integerPart || '0'}.${decimalPart}`);
  }

  return parseFloat(limpio.replace(/[.,]/g, ''));
}

function limpiarDescripcion(texto) {
  let resultado = texto;
  for (const stopword of STOPWORDS) {
    const regex = new RegExp(`\\b${stopword}\\b`, 'gi');
    resultado = resultado.replace(regex, ' ');
  }
  return resultado.replace(/\s+/g, ' ').trim();
}

function parsearMensaje(body) {
  const original = (body || '').trim();
  const match = REGEX_MONTO.exec(original);

  if (!match) {
    return { monto: null, descripcion: '', original };
  }

  const monto = normalizarMonto(match[1]);
  if (Number.isNaN(monto)) {
    return { monto: null, descripcion: '', original };
  }

  const sinMonto = (original.slice(0, match.index) + original.slice(match.index + match[0].length)).trim();
  const descripcion = limpiarDescripcion(sinMonto) || 'Sin descripcion';

  return { monto, descripcion, original };
}

function esPregunta(texto) {
  const limpio = (texto || '').trim().toLowerCase();
  if (!limpio) return false;
  if (limpio.includes('?')) return true;
  const primeraPalabra = limpio.split(/\s+/)[0];
  return PALABRAS_PREGUNTA.includes(primeraPalabra);
}

module.exports = { parsearMensaje, esPregunta };
