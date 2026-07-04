const express = require('express');
const { leerGastos, eliminarGasto } = require('../services/sheetsService');
const { ORDEN_CATEGORIAS } = require('../config/categorias');
const { obtenerGrupo, verificarPassword } = require('../config/grupos');

const router = express.Router();

function resolverSpreadsheetId(req, res) {
  const { grupo, password } = req.query;
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

function obtenerMesDeFecha(fecha) {
  return (fecha || '').slice(0, 7); // YYYY-MM
}

function aplicarFiltros(gastos, { mes, categoria, persona } = {}) {
  return gastos.filter((gasto) => {
    if (mes && obtenerMesDeFecha(gasto.fecha) !== mes) return false;
    if (categoria && gasto.categoria !== categoria) return false;
    if (persona && gasto.persona !== persona) return false;
    return true;
  });
}

function mesAnterior(mesStr) {
  const [anio, mes] = mesStr.split('-').map(Number);
  const fecha = new Date(anio, mes - 2, 1);
  const anioAnterior = fecha.getFullYear();
  const mesAnteriorNum = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${anioAnterior}-${mesAnteriorNum}`;
}

function calcularEvolucionMensual(gastos, persona) {
  const gastosFiltrados = persona ? gastos.filter((g) => g.persona === persona) : gastos;
  const totales = {};
  gastosFiltrados.forEach((gasto) => {
    const mes = obtenerMesDeFecha(gasto.fecha);
    totales[mes] = (totales[mes] || 0) + gasto.monto;
  });
  return Object.keys(totales)
    .sort()
    .slice(-12)
    .map((mes) => ({ mes, total: totales[mes] }));
}

router.get('/', async (req, res) => {
  const spreadsheetId = resolverSpreadsheetId(req, res);
  if (!spreadsheetId) return;

  try {
    const gastos = await leerGastos(spreadsheetId);
    const filtrados = aplicarFiltros(gastos, req.query);
    res.json(filtrados.sort((a, b) => (a.fecha < b.fecha ? 1 : -1)));
  } catch (err) {
    console.error('Error al leer gastos:', err);
    res.status(500).json({ error: 'No se pudo leer la planilla de gastos' });
  }
});

router.get('/resumen', async (req, res) => {
  const spreadsheetId = resolverSpreadsheetId(req, res);
  if (!spreadsheetId) return;

  try {
    const gastos = await leerGastos(spreadsheetId);
    const { mes, persona } = req.query;
    const gastosDelMes = aplicarFiltros(gastos, { mes, persona });

    const totalMes = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);
    const mesAnteriorStr = mes ? mesAnterior(mes) : null;
    const totalMesAnterior = mesAnteriorStr
      ? aplicarFiltros(gastos, { mes: mesAnteriorStr, persona }).reduce((sum, g) => sum + g.monto, 0)
      : null;

    const porCategoria = ORDEN_CATEGORIAS.map((categoria) => ({
      categoria,
      total: gastosDelMes.filter((g) => g.categoria === categoria).reduce((sum, g) => sum + g.monto, 0),
    })).filter((c) => c.total > 0);

    const porPersona = {};
    gastosDelMes.forEach((gasto) => {
      porPersona[gasto.persona] = (porPersona[gasto.persona] || 0) + gasto.monto;
    });

    const evolucionMensual = calcularEvolucionMensual(gastos, persona);

    res.json({ totalMes, totalMesAnterior, porCategoria, porPersona, evolucionMensual });
  } catch (err) {
    console.error('Error al calcular resumen:', err);
    res.status(500).json({ error: 'No se pudo calcular el resumen' });
  }
});

router.delete('/:fila', async (req, res) => {
  const spreadsheetId = resolverSpreadsheetId(req, res);
  if (!spreadsheetId) return;

  const numeroFila = parseInt(req.params.fila, 10);
  if (Number.isNaN(numeroFila) || numeroFila < 2) {
    res.status(400).json({ error: 'Fila invalida' });
    return;
  }

  try {
    await eliminarGasto(spreadsheetId, numeroFila);
    res.json({ ok: true });
  } catch (err) {
    console.error('Error al eliminar gasto:', err);
    res.status(500).json({ error: 'No se pudo eliminar el gasto' });
  }
});

module.exports = router;
