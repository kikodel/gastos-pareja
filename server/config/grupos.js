const { env } = require('./env');

function listarGrupos() {
  return Object.entries(env.grupos).map(([id, grupo]) => ({ id, nombre: grupo.nombre }));
}

function obtenerGrupo(id) {
  return env.grupos[id] || null;
}

function resolverGrupoYPersonaPorNumero(fromWhatsapp) {
  for (const [id, grupo] of Object.entries(env.grupos)) {
    if (grupo.personas && grupo.personas[fromWhatsapp]) {
      return {
        grupoId: id,
        grupoNombre: grupo.nombre,
        spreadsheetId: grupo.spreadsheetId,
        persona: grupo.personas[fromWhatsapp],
      };
    }
  }
  return null;
}

module.exports = { listarGrupos, obtenerGrupo, resolverGrupoYPersonaPorNumero };
