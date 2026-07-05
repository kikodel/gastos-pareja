const STOPWORDS = ['gaste', 'gasté', 'pague', 'pagué', 'compre', 'compré', 'gasto', 'pago', 'en', 'de', 'por', 'del', 'al'];

const PALABRAS_PREGUNTA = [
  'cuanto', 'cuánto', 'cuanta', 'cuánta', 'cuantos', 'cuántos', 'cuantas', 'cuántas',
  'como', 'cómo', 'que', 'qué', 'cual', 'cuál', 'cuales', 'cuáles', 'resumen', 'total',
];

const REGEX_MONTO = /\$?\s*([0-9][0-9.,]*)/;
const REGEX_CUOTAS = /\b([0-9]+)\s*cuotas?\b/i;

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

  const matchCuotas = REGEX_CUOTAS.exec(original);
  const cuotas = matchCuotas ? Math.max(1, parseInt(matchCuotas[1], 10)) : 1;
  const textoSinCuotas = matchCuotas
    ? (original.slice(0, matchCuotas.index) + original.slice(matchCuotas.index + matchCuotas[0].length)).trim()
    : original;

  const match = REGEX_MONTO.exec(textoSinCuotas);

  if (!match) {
    return { monto: null, descripcion: '', original, cuotas: 1 };
  }

  const monto = normalizarMonto(match[1]);
  if (Number.isNaN(monto)) {
    return { monto: null, descripcion: '', original, cuotas: 1 };
  }

  const sinMonto = (textoSinCuotas.slice(0, match.index) + textoSinCuotas.slice(match.index + match[0].length)).trim();
  const descripcion = limpiarDescripcion(sinMonto) || 'Sin descripcion';

  return { monto, descripcion, original, cuotas };
}

function esPregunta(texto) {
  const limpio = (texto || '').trim().toLowerCase();
  if (!limpio) return false;
  if (limpio.includes('?')) return true;
  const primeraPalabra = limpio.split(/\s+/)[0];
  return PALABRAS_PREGUNTA.includes(primeraPalabra);
}

module.exports = { parsearMensaje, esPregunta };
