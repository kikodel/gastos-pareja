const TTL_MS = 15 * 60 * 1000;

const pendientes = new Map();

function guardarConfirmacionPendiente(numeroWhatsapp, entrada) {
  pendientes.set(numeroWhatsapp, { ...entrada, timestamp: Date.now() });
}

function obtenerConfirmacionPendiente(numeroWhatsapp) {
  const entrada = pendientes.get(numeroWhatsapp);
  if (!entrada) return null;
  if (Date.now() - entrada.timestamp > TTL_MS) {
    pendientes.delete(numeroWhatsapp);
    return null;
  }
  return entrada;
}

function limpiarConfirmacionPendiente(numeroWhatsapp) {
  pendientes.delete(numeroWhatsapp);
}

module.exports = { guardarConfirmacionPendiente, obtenerConfirmacionPendiente, limpiarConfirmacionPendiente };
