const { google } = require('googleapis');
const { env } = require('../config/env');

const SHEET_NAME = 'Gastos';
const RANGE_APPEND = `${SHEET_NAME}!A:G`;
const RANGE_READ = `${SHEET_NAME}!A2:G`;
const CACHE_TTL_MS = 45 * 1000;

const cachePorSheet = new Map();

function getAuth() {
  return new google.auth.JWT(
    env.googleServiceAccountEmail,
    null,
    env.googleServiceAccountPrivateKey,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
}

async function getSheetsClient() {
  const auth = getAuth();
  await auth.authorize();
  return google.sheets({ version: 'v4', auth });
}

async function agregarGasto(spreadsheetId, { fecha, persona, monto, categoria, descripcion, mensajeOriginal, moneda }) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: RANGE_APPEND,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[fecha, persona, monto, categoria, descripcion, mensajeOriginal, moneda]],
    },
  });
  cachePorSheet.delete(spreadsheetId);
}

async function leerGastosSinCache(spreadsheetId) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: RANGE_READ,
  });
  const filas = res.data.values || [];
  return filas
    .filter((fila) => fila.length > 0 && fila[0])
    .map((fila) => ({
      fecha: fila[0] || '',
      persona: fila[1] || '',
      monto: parseFloat(fila[2]) || 0,
      categoria: fila[3] || 'Otros',
      descripcion: fila[4] || '',
      mensajeOriginal: fila[5] || '',
      moneda: fila[6] || 'ARS',
    }));
}

async function leerGastos(spreadsheetId) {
  const ahora = Date.now();
  const cacheado = cachePorSheet.get(spreadsheetId);
  if (cacheado && ahora - cacheado.timestamp < CACHE_TTL_MS) {
    return cacheado.data;
  }
  const datos = await leerGastosSinCache(spreadsheetId);
  cachePorSheet.set(spreadsheetId, { data: datos, timestamp: ahora });
  return datos;
}

module.exports = { agregarGasto, leerGastos };
