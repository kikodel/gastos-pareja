const { google } = require('googleapis');
const { env } = require('../config/env');

const SHEET_NAME = 'Gastos';
const RANGE_APPEND = `${SHEET_NAME}!A:G`;
const RANGE_READ = `${SHEET_NAME}!A2:G`;
const CACHE_TTL_MS = 45 * 1000;

const CONFIG_SHEET_NAME = 'Config';
const CONFIG_RANGE_READ = `${CONFIG_SHEET_NAME}!A2:B1000`;
const CONFIG_RANGE_FULL = `${CONFIG_SHEET_NAME}!A1:B1000`;
const CONFIG_LIMITE_PREFIJO = 'Limite_';

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
    .map((fila, indice) => ({ fila, numeroFila: indice + 2 }))
    .filter(({ fila }) => fila.length > 0 && fila[0])
    .map(({ fila, numeroFila }) => ({
      fila: numeroFila,
      fecha: fila[0] || '',
      persona: fila[1] || '',
      monto: parseFloat(fila[2]) || 0,
      categoria: fila[3] || 'Otros',
      descripcion: fila[4] || '',
      mensajeOriginal: fila[5] || '',
      moneda: fila[6] || 'ARS',
    }));
}

async function obtenerSheetIdPorTitulo(sheets, spreadsheetId, titulo) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties',
  });
  const hoja = (metadata.data.sheets || []).find((h) => h.properties.title === titulo);
  return hoja ? hoja.properties.sheetId : null;
}

async function eliminarGasto(spreadsheetId, numeroFila) {
  const sheets = await getSheetsClient();
  const sheetId = await obtenerSheetIdPorTitulo(sheets, spreadsheetId, SHEET_NAME);
  if (sheetId === null) {
    throw new Error(`No se encontro la hoja "${SHEET_NAME}"`);
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: numeroFila - 1,
              endIndex: numeroFila,
            },
          },
        },
      ],
    },
  });

  cachePorSheet.delete(spreadsheetId);
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

async function asegurarHojaConfig(sheets, spreadsheetId) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: 'sheets.properties.title',
  });
  const existe = (metadata.data.sheets || []).some(
    (hoja) => hoja.properties.title === CONFIG_SHEET_NAME
  );

  if (!existe) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: CONFIG_SHEET_NAME } } }],
      },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${CONFIG_SHEET_NAME}!A1:B1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['Clave', 'Valor']] },
    });
  }
}

function filasAConfig(filas) {
  const config = { ingresoMensual: null, metaAhorro: null, limites: {} };
  filas.forEach((fila) => {
    const clave = (fila[0] || '').trim();
    const valor = parseFloat(fila[1]);
    if (Number.isNaN(valor)) return;

    if (clave === 'IngresoMensual') {
      config.ingresoMensual = valor;
    } else if (clave === 'MetaAhorro') {
      config.metaAhorro = valor;
    } else if (clave.startsWith(CONFIG_LIMITE_PREFIJO)) {
      const categoria = clave.slice(CONFIG_LIMITE_PREFIJO.length);
      config.limites[categoria] = valor;
    }
  });
  return config;
}

async function leerConfig(spreadsheetId) {
  const sheets = await getSheetsClient();
  await asegurarHojaConfig(sheets, spreadsheetId);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: CONFIG_RANGE_READ,
  });
  return filasAConfig(res.data.values || []);
}

async function guardarConfig(spreadsheetId, { ingresoMensual, metaAhorro, limites }) {
  const sheets = await getSheetsClient();
  await asegurarHojaConfig(sheets, spreadsheetId);

  const filas = [];
  if (ingresoMensual !== null && ingresoMensual !== undefined && !Number.isNaN(ingresoMensual)) {
    filas.push(['IngresoMensual', ingresoMensual]);
  }
  if (metaAhorro !== null && metaAhorro !== undefined && !Number.isNaN(metaAhorro)) {
    filas.push(['MetaAhorro', metaAhorro]);
  }
  Object.entries(limites || {}).forEach(([categoria, valor]) => {
    if (valor !== null && valor !== undefined && !Number.isNaN(valor) && valor > 0) {
      filas.push([`${CONFIG_LIMITE_PREFIJO}${categoria}`, valor]);
    }
  });

  await sheets.spreadsheets.values.clear({ spreadsheetId, range: CONFIG_RANGE_FULL });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: CONFIG_RANGE_FULL,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [['Clave', 'Valor'], ...filas] },
  });

  return filasAConfig(filas);
}

module.exports = { agregarGasto, leerGastos, eliminarGasto, leerConfig, guardarConfig };
