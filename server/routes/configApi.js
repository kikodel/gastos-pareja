const express = require('express');
const { leerConfig, guardarConfig } = require('../services/sheetsService');
const { obtenerGrupo, verificarPassword } = require('../config/grupos');

const router = express.Router();

function resolverSpreadsheetId(req, res, password) {
  const { grupo } = req.query;
  if (!grupo) {
    res.status(400).json({ error: 'Falta el parametro grupo' });
    return null;
  }
  const grupoConfig = obtenerGrupo(grupo);
  if (!grupoConfig) {
    res.status(404).json({ error: `Grupo desconocido: ${grupo}` });
    return null;
  }
  if (!verificarPassword(grupo, password || '')) {
    res.status(401).json({ error: 'Contrasena incorrecta' });
    return null;
  }
  return grupoConfig.spreadsheetId;
}

router.get('/', async (req, res) => {
  const spreadsheetId = resolverSpreadsheetId(req, res, req.query.password);
  if (!spreadsheetId) return;

  try {
    const config = await leerConfig(spreadsheetId);
    res.json(config);
  } catch (err) {
    console.error('Error al leer configuracion:', err);
    res.status(500).json({ error: 'No se pudo leer la configuracion' });
  }
});

router.put('/', async (req, res) => {
  const spreadsheetId = resolverSpreadsheetId(req, res, req.body.password);
  if (!spreadsheetId) return;

  const ingresoMensual = req.body.ingresoMensual !== undefined ? parseFloat(req.body.ingresoMensual) : null;
  const metaAhorro = req.body.metaAhorro !== undefined ? parseFloat(req.body.metaAhorro) : null;
  const limites = {};
  Object.entries(req.body.limites || {}).forEach(([categoria, valor]) => {
    const numero = parseFloat(valor);
    if (!Number.isNaN(numero) && numero > 0) {
      limites[categoria] = numero;
    }
  });

  try {
    const config = await guardarConfig(spreadsheetId, { ingresoMensual, metaAhorro, limites });
    res.json(config);
  } catch (err) {
    console.error('Error al guardar configuracion:', err);
    res.status(500).json({ error: 'No se pudo guardar la configuracion' });
  }
});

module.exports = router;
