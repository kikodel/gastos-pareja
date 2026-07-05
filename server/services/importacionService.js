const { crearCliente, extraerTexto } = require('./claudeService');
const { env } = require('../config/env');
const { categorizar } = require('./categorizerService');

const MODELO_IMPORTACION = 'claude-sonnet-5';
const TIMEOUT_MS = 45000;
const MAX_CARACTERES = 60000;

function limpiarJson(texto) {
  return texto.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
}

function numeroONulo(valor) {
  const numero = parseInt(valor, 10);
  return Number.isNaN(numero) ? null : numero;
}

async function extraerMovimientos(textoPdf) {
  if (!env.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY no esta configurada');
  }

  const texto = (textoPdf || '').slice(0, MAX_CARACTERES);
  if (!texto.trim()) {
    throw new Error('No se pudo extraer texto del PDF (puede ser un escaneo/imagen sin texto seleccionable)');
  }

  const cliente = crearCliente();
  const respuesta = await cliente.messages.create(
    {
      model: MODELO_IMPORTACION,
      max_tokens: 4096,
      system:
        'Sos un extractor de movimientos de resumenes de tarjeta de credito argentinos, de cualquier banco o tarjeta. ' +
        'Te paso el texto extraido de un PDF y tenes que devolver SOLO un JSON (sin markdown, sin texto alrededor) con un array de movimientos, ' +
        'cada uno con este formato exacto: {"fecha": "YYYY-MM-DD o null si no esta claro", "descripcion": "comercio o detalle del consumo, SIN mencionar el numero de cuota", ' +
        '"monto": numero positivo, "cuotaActual": numero de cuota actual si el resumen lo indica (ej "CUOTA 03/12" -> 3) o null si no aplica, ' +
        '"cuotasTotal": cantidad total de cuotas si el resumen lo indica (ej "CUOTA 03/12" -> 12) o null si no aplica}. ' +
        'Reglas importantes: ' +
        '- Incluí unicamente consumos/compras individuales; NO incluyas saldo anterior, pagos recibidos, intereses, IVA, seguros, cargos administrativos ni el total a pagar. ' +
        '- Si un consumo esta en cuotas, el monto que aparece en el resumen YA es el de esa cuota puntual — no calcules ni multipliques nada. ' +
        '- Si no hay ningun movimiento reconocible, devolvé un array vacio []. ' +
        '- No inventes movimientos que no esten en el texto.',
      messages: [{ role: 'user', content: texto }],
    },
    { timeout: TIMEOUT_MS }
  );

  const textoRespuesta = extraerTexto(respuesta).trim();
  const jsonLimpio = limpiarJson(textoRespuesta);

  let movimientos;
  try {
    movimientos = JSON.parse(jsonLimpio);
  } catch (err) {
    throw new Error('No se pudo interpretar la respuesta de la IA como JSON');
  }

  if (!Array.isArray(movimientos)) {
    throw new Error('La IA no devolvio un array de movimientos');
  }

  const movimientosValidos = [];
  for (const mov of movimientos) {
    const monto = parseFloat(mov.monto);
    if (Number.isNaN(monto) || monto <= 0) continue;
    const descripcion = (mov.descripcion || 'Sin descripcion').toString().trim();
    const categoria = await categorizar(descripcion);
    const cuotaActual = numeroONulo(mov.cuotaActual);
    const cuotasTotal = numeroONulo(mov.cuotasTotal);
    movimientosValidos.push({
      fecha: typeof mov.fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(mov.fecha) ? mov.fecha : null,
      descripcion,
      monto,
      categoria,
      cuotaActual,
      cuotasTotal: cuotasTotal && cuotasTotal > (cuotaActual || 0) ? cuotasTotal : null,
    });
  }

  return movimientosValidos;
}

module.exports = { extraerMovimientos };
