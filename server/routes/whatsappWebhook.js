const express = require('express');
const { parsearMensaje } = require('../services/parserService');
const { categorizar } = require('../services/categorizerService');
const { agregarGasto, leerGastos, leerConfig } = require('../services/sheetsService');
const {
  crearRespuestaConfirmacion,
  crearRespuestaError,
  crearRespuestaNumeroNoRegistrado,
} = require('../services/twilioService');
const { calcularAlertas } = require('../services/alertasService');
const { resolverGrupoYPersonaPorNumero } = require('../config/grupos');
const { validateTwilioSignature } = require('../utils/validateTwilioSignature');

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
  const { From, Body } = req.body;

  const resuelto = resolverGrupoYPersonaPorNumero(From);
  if (!resuelto) {
    res.type('text/xml').send(crearRespuestaNumeroNoRegistrado());
    return;
  }

  const { monto, descripcion, original } = parsearMensaje(Body);

  if (monto === null) {
    res.type('text/xml').send(crearRespuestaError());
    return;
  }

  const categoria = await categorizar(descripcion);
  const { persona, spreadsheetId } = resuelto;
  const fecha = formatearFecha(new Date());
  const mesActual = fecha.slice(0, 7);

  let alertas = [];
  try {
    const [gastosAntes, config] = await Promise.all([
      leerGastos(spreadsheetId),
      leerConfig(spreadsheetId),
    ]);
    alertas = calcularAlertas({ gastosAntes, config, categoria, monto, mesActual });
  } catch (err) {
    console.error('Error al calcular alertas (se ignora, no bloquea el registro):', err);
  }

  try {
    await agregarGasto(spreadsheetId, {
      fecha,
      persona,
      monto,
      categoria,
      descripcion,
      mensajeOriginal: original,
      moneda: 'ARS',
    });
  } catch (err) {
    console.error('Error al escribir en Google Sheets:', err);
    res.status(500).type('text/xml').send(crearRespuestaError());
    return;
  }

  res.type('text/xml').send(
    crearRespuestaConfirmacion({ monto, categoria, descripcion, persona, alertas })
  );
});

module.exports = router;
