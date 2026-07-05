const TIMEZONE = 'America/Argentina/Buenos_Aires';
const REGEX_CUOTA = /^(.*) \(cuota (\d+)\/(\d+)\)$/;

function obtenerMesActualReal() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
  });
  const partes = formatter.formatToParts(new Date()).reduce((acc, parte) => {
    acc[parte.type] = parte.value;
    return acc;
  }, {});
  return `${partes.year}-${partes.month}`;
}

function obtenerMesDeFecha(fecha) {
  return (fecha || '').slice(0, 7);
}

function mesSiguiente(mes) {
  const [anio, numeroMes] = mes.split('-').map(Number);
  const fecha = new Date(anio, numeroMes, 1);
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
}

function calcularPendientesProximoMes(gastos, mesActual) {
  const mes = mesSiguiente(mesActual);
  const gastosDelMes = gastos.filter((g) => obtenerMesDeFecha(g.fecha) === mes);
  const total = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);

  const porCategoria = {};
  gastosDelMes.forEach((g) => {
    porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.monto;
  });

  return { mes, total, cantidad: gastosDelMes.length, porCategoria };
}

function extraerInfoCuota(descripcion) {
  const match = REGEX_CUOTA.exec(descripcion || '');
  if (!match) return null;
  return {
    descripcionBase: match[1],
    cuotaActual: parseInt(match[2], 10),
    cuotasTotal: parseInt(match[3], 10),
  };
}

function calcularCuotasActivas(gastos, mesActual) {
  const grupos = new Map();

  gastos.forEach((gasto) => {
    const info = extraerInfoCuota(gasto.descripcion);
    if (!info) return;

    const clave = `${gasto.mensajeOriginal}|||${gasto.persona}|||${info.descripcionBase}`;
    if (!grupos.has(clave)) {
      grupos.set(clave, {
        descripcion: info.descripcionBase,
        categoria: gasto.categoria,
        persona: gasto.persona,
        cuotasTotal: info.cuotasTotal,
        filas: [],
      });
    }
    grupos.get(clave).filas.push({ fecha: gasto.fecha, monto: gasto.monto, cuotaActual: info.cuotaActual });
  });

  const resultado = [];
  grupos.forEach((grupo) => {
    const filasFuturas = grupo.filas.filter((f) => obtenerMesDeFecha(f.fecha) > mesActual);
    if (filasFuturas.length === 0) return;

    const filasHastaAhora = grupo.filas.filter((f) => obtenerMesDeFecha(f.fecha) <= mesActual);
    const cuotaActualNum =
      filasHastaAhora.length > 0
        ? Math.max(...filasHastaAhora.map((f) => f.cuotaActual))
        : Math.min(...grupo.filas.map((f) => f.cuotaActual)) - 1;

    const montoPorCuota = filasFuturas[0].monto;

    resultado.push({
      descripcion: grupo.descripcion,
      categoria: grupo.categoria,
      persona: grupo.persona,
      cuotaActual: Math.max(cuotaActualNum, 0),
      cuotasTotal: grupo.cuotasTotal,
      cuotasRestantes: filasFuturas.length,
      montoPorCuota,
      montoRestante: filasFuturas.reduce((sum, f) => sum + f.monto, 0),
    });
  });

  return resultado.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
}

module.exports = { obtenerMesActualReal, calcularPendientesProximoMes, calcularCuotasActivas };
