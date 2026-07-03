const { twiml: { MessagingResponse } } = require('twilio');

function formatearMonto(monto) {
  return monto.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function crearRespuestaConfirmacion({ monto, categoria, descripcion, persona }) {
  const twimlResponse = new MessagingResponse();
  twimlResponse.message(
    `✅ Gasto registrado: $${formatearMonto(monto)} - ${categoria} (${descripcion}) - ${persona}`
  );
  return twimlResponse.toString();
}

function crearRespuestaError() {
  const twimlResponse = new MessagingResponse();
  twimlResponse.message(
    '⚠️ No entendí el monto. Probá con el formato: "150 supermercado" o "$3200 nafta auto".'
  );
  return twimlResponse.toString();
}

function crearRespuestaNumeroNoRegistrado() {
  const twimlResponse = new MessagingResponse();
  twimlResponse.message(
    '⚠️ Tu número no está registrado en ningún grupo familiar. Pedile al administrador que te agregue.'
  );
  return twimlResponse.toString();
}

module.exports = { crearRespuestaConfirmacion, crearRespuestaError, crearRespuestaNumeroNoRegistrado };
