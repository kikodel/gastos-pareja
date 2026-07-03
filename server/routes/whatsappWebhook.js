const express = require('express');
const { parsearMensaje } = require('../services/parserService');
const { categorizar } = require('../services/categorizerService');
const { agregarGasto } = require('../services/sheetsService');
const { crearRespuestaConfirmacion, crearRespuestaError } = require('../services/twilioService');
const { resolverPersona } = require('../config/personas');
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
  const { From, Body, ProfileName } = req.body;
  const { monto, descripcion, original } = parsearMensaje(Body);

  if (monto === null) {
    res.type('text/xml').send(crearRespuestaError());
    return;
  }

  const categoria = categorizar(descripcion);
  const persona = resolverPersona(From, ProfileName);
  const fecha = formatearFecha(new Date());

  try {
    await agregarGasto({
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
    crearRespuestaConfirmacion({ monto, categoria, descripcion, persona })
  );
});

module.exports = router;
