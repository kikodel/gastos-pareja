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

function extraerInfoCuota(descripcion) {
  const match = REGEX_CUOTA.exec(descripcion || '');
  if (!match) return null;
  return {
    descripcionBase: match[1],
    cuotaActual: parseInt(match[2], 10),
    cuotasTotal: parseInt(match[3], 10),
  };
}

/**
 * Agrupa por descripcion+persona (no por mensajeOriginal) para que las cuotas
 * cargadas por WhatsApp (que generan filas futuras reales) y las importadas
 * de un PDF (una sola fila, sin filas futuras) puedan reconocerse como la
 * misma compra si el resumen de un mes posterior se vuelve a importar.
 */
function calcularCuotasActivas(gastos, mesActual) {
  const grupos = new Map();

  gastos.forEach((gasto) => {
    const info = extraerInfoCuota(gasto.descripcion);
    if (!info) return;

    const clave = `${info.descripcionBase}|||${gasto.persona}`;
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
    const filasHastaAhora = grupo.filas.filter((f) => obtenerMesDeFecha(f.fecha) <= mesActual);
    const filasFuturas = grupo.filas.filter((f) => obtenerMesDeFecha(f.fecha) > mesActual);

    // La "cuota actual" es la mas avanzada entre las filas cuya fecha ya llego (pasada o del
    // mes en curso). Si se generaron filas reales de meses futuros por adelantado (cuotas de
    // WhatsApp, o de PDF marcadas como "Cuotas"), esas filas futuras NO cuentan para decidir
    // si la compra ya esta saldada -- solo cuentan cuando su mes efectivamente llega.
    const cuotaMasAvanzada =
      filasHastaAhora.length > 0
        ? Math.max(...filasHastaAhora.map((f) => f.cuotaActual))
        : Math.min(...grupo.filas.map((f) => f.cuotaActual)) - 1;
    if (cuotaMasAvanzada >= grupo.cuotasTotal) return; // ya se termino de pagar

    const cuotasRestantes = grupo.cuotasTotal - cuotaMasAvanzada;
    const filaDeReferencia = grupo.filas.find((f) => f.cuotaActual === cuotaMasAvanzada) || grupo.filas[0];

    resultado.push({
      descripcion: grupo.descripcion,
      categoria: grupo.categoria,
      persona: grupo.persona,
      cuotaActual: cuotaMasAvanzada,
      cuotasTotal: grupo.cuotasTotal,
      cuotasRestantes,
      montoPorCuota: filaDeReferencia.monto,
      montoRestante:
        filasFuturas.length > 0
          ? filasFuturas.reduce((sum, f) => sum + f.monto, 0)
          : filaDeReferencia.monto * cuotasRestantes,
      // true si no hay filas futuras reales en la Sheet y el monto restante es una proyeccion
      // (tipico de cuotas importadas de un PDF, que no generan las filas de los meses siguientes)
      proyectado: filasFuturas.length === 0,
    });
  });

  return resultado.sort((a, b) => a.descripcion.localeCompare(b.descripcion));
}

function calcularPendientesProximoMes(gastos, mesActual) {
  const mes = mesSiguiente(mesActual);
  const gastosDelMes = gastos.filter((g) => obtenerMesDeFecha(g.fecha) === mes);

  let total = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);
  let cantidad = gastosDelMes.length;
  const porCategoria = {};
  gastosDelMes.forEach((g) => {
    porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.monto;
  });

  const cuotasActivas = calcularCuotasActivas(gastos, mesActual);
  cuotasActivas.forEach((cuota) => {
    if (cuota.proyectado && cuota.cuotasRestantes > 0) {
      total += cuota.montoPorCuota;
      cantidad += 1;
      porCategoria[cuota.categoria] = (porCategoria[cuota.categoria] || 0) + cuota.montoPorCuota;
    }
  });

  return { mes, total, cantidad, porCategoria };
}

module.exports = { obtenerMesActualReal, calcularPendientesProximoMes, calcularCuotasActivas };
