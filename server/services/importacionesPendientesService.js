const TTL_MS = 24 * 60 * 60 * 1000;

const pendientes = new Map();

function guardarPendiente(grupoId, movimientos) {
  pendientes.set(grupoId, { movimientos, timestamp: Date.now() });
}

function obtenerPendiente(grupoId) {
  const entrada = pendientes.get(grupoId);
  if (!entrada) return null;
  if (Date.now() - entrada.timestamp > TTL_MS) {
    pendientes.delete(grupoId);
    return null;
  }
  return entrada.movimientos;
}

function limpiarPendiente(grupoId) {
  pendientes.delete(grupoId);
}

module.exports = { guardarPendiente, obtenerPendiente, limpiarPendiente };
