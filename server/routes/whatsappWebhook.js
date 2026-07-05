const express = require('express');
const { parsearMensaje, esPregunta } = require('../services/parserService');
const { categorizar } = require('../services/categorizerService');
const { agregarGasto, leerGastos, leerConfig } = require('../services/sheetsService');
const { calcularMontosPorCuota, generarFechasCuotas } = require('../services/cuotasService');
const {
  crearRespuestaConfirmacion,
  crearRespuestaConfirmacionCuotas,
  crearRespuestaError,
  crearRespuestaNumeroNoRegistrado,
  crearRespuestaTexto,
} = require('../services/twilioService');
const { calcularAlertas } = require('../services/alertasService');
const { responderPregunta } = require('../services/preguntasService');
const { resolverGrupoYPersonaPorNumero } = require('../config/grupos');
const { validateTwilioSignature } = require('../utils/validateTwilioSignature');
const { descargarMediaTwilio } = require('../services/mediaService');
const { extraerTextoPdf } = require('../services/pdfService');
const { extraerMovimientos } = require('../services/importacionService');
const { guardarPendiente } = require('../services/importacionesPendientesService');
const { env } = require('../config/env');

const router = express.Router();
const TIMEZONE = 'America/Argentina/Buenos_Aires';

function formatearFecha(date) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const partes = formatter.formatToParts(date).reduce((acc, parte) => {
    acc[parte.type] = parte.value;
    return acc;
  }, {});
  return `${partes.year}-${partes.month}-${partes.day} ${partes.hour}:${partes.minute}`;
}

router.post('/', validateTwilioSignature, async (req, res) => {
  const { From, Body, NumMedia, MediaUrl0, MediaContentType0 } = req.body;

  const resuelto = resolverGrupoYPersonaPorNumero(From);
  if (!resuelto) {
    res.type('text/xml').send(crearRespuestaNumeroNoRegistrado());
    return;
  }

  const { persona, spreadsheetId, grupoId } = resuelto;

  const esPdfAdjunto = parseInt(NumMedia, 10) > 0 && (MediaContentType0 || '').toLowerCase() === 'application/pdf';
  if (esPdfAdjunto) {
    try {
      const buffer = await descargarMediaTwilio(MediaUrl0);
      const textoPdf = await extraerTextoPdf(buffer);
      const movimientos = await extraerMovimientos(textoPdf);
      guardarPendiente(grupoId, movimientos);

      const link = env.publicBaseUrl ? ` ${env.publicBaseUrl}` : '';
      res.type('text/xml').send(
        crearRespuestaTexto(
          `📄 Recibí tu resumen y encontré ${movimientos.length} movimiento(s). Entrá al dashboard (botón "📄 Importar resumen") para revisarlos y confirmar antes de guardarlos:${link}`
        )
      );
    } catch (err) {
      console.error('Error al procesar PDF recibido por WhatsApp:', err);
      res.type('text/xml').send(
        crearRespuestaTexto('⚠️ No pude leer ese PDF. Probá subirlo directamente desde el botón "Importar resumen" del dashboard.')
      );
    }
    return;
  }

  const { monto, descripcion, original, cuotas } = parsearMensaje(Body);
  const ahora = new Date();
  const fecha = formatearFecha(ahora);
  const mesActual = fecha.slice(0, 7);

  if (monto === null) {
    if (esPregunta(Body)) {
      try {
        const [gastos, config] = await Promise.all([leerGastos(spreadsheetId), leerConfig(spreadsheetId)]);
        const respuesta = await responderPregunta({ pregunta: Body, gastos, config, persona, mesActual });
        res.type('text/xml').send(crearRespuestaTexto(respuesta));
      } catch (err) {
        console.error('Error al responder pregunta:', err);
        res.type('text/xml').send(crearRespuestaTexto('No pude responder tu pregunta ahora, intentá de nuevo en un rato.'));
      }
      return;
    }

    res.type('text/xml').send(crearRespuestaError());
    return;
  }

  const categoria = await categorizar(descripcion);
  const esCuotas = cuotas > 1;
  const montosPorCuota = esCuotas ? calcularMontosPorCuota(monto, cuotas) : [monto];
  const fechasCuotas = esCuotas ? generarFechasCuotas(ahora, cuotas) : [ahora];

  let alertas = [];
  try {
    const [gastosAntes, config] = await Promise.all([
      leerGastos(spreadsheetId),
      leerConfig(spreadsheetId),
    ]);
    alertas = calcularAlertas({ gastosAntes, config, categoria, monto: montosPorCuota[0], mesActual });
  } catch (err) {
    console.error('Error al calcular alertas (se ignora, no bloquea el registro):', err);
  }

  try {
    for (let i = 0; i < fechasCuotas.length; i += 1) {
      await agregarGasto(spreadsheetId, {
        fecha: formatearFecha(fechasCuotas[i]),
        persona,
        monto: montosPorCuota[i],
        categoria,
        descripcion: esCuotas ? `${descripcion} (cuota ${i + 1}/${cuotas})` : descripcion,
        mensajeOriginal: original,
        moneda: 'ARS',
      });
    }
  } catch (err) {
    console.error('Error al escribir en Google Sheets:', err);
    res.status(500).type('text/xml').send(crearRespuestaError());
    return;
  }

  const respuestaTwiml = esCuotas
    ? crearRespuestaConfirmacionCuotas({
        montoTotal: monto,
        cuotas,
        montoPorCuota: montosPorCuota[0],
        categoria,
        descripcion,
        persona,
        alertas,
      })
    : crearRespuestaConfirmacion({ monto, categoria, descripcion, persona, alertas });

  res.type('text/xml').send(respuestaTwiml);
});

module.exports = router;
