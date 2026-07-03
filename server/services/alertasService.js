const { formatearMonto } = require('./twilioService');

function obtenerMesDeFecha(fecha) {
  return (fecha || '').slice(0, 7);
}

function calcularAlertas({ gastosAntes, config, categoria, monto, mesActual }) {
  const alertas = [];
  if (!config) return alertas;

  const gastosDelMesAntes = gastosAntes.filter((g) => obtenerMesDeFecha(g.fecha) === mesActual);

  const porcentaje = config.limites ? config.limites[categoria] : null;
  if (porcentaje && config.ingresoMensual) {
    const limite = config.ingresoMensual * (porcentaje / 100);
    const totalCategoriaAntes = gastosDelMesAntes
      .filter((g) => g.categoria === categoria)
      .reduce((sum, g) => sum + g.monto, 0);
    const totalCategoriaDespues = totalCategoriaAntes + monto;
    if (totalCategoriaAntes < limite && totalCategoriaDespues >= limite) {
      alertas.push(
        `🚨 Superaron el límite de "${categoria}" de este mes: ${porcentaje}% del ingreso ($${formatearMonto(limite)}). Llevan gastado $${formatearMonto(totalCategoriaDespues)}.`
      );
    }
  }

  if (config.ingresoMensual && config.metaAhorro) {
    const totalMesAntes = gastosDelMesAntes.reduce((sum, g) => sum + g.monto, 0);
    const totalMesDespues = totalMesAntes + monto;
    const ahorroAntes = config.ingresoMensual - totalMesAntes;
    const ahorroDespues = config.ingresoMensual - totalMesDespues;
    if (ahorroAntes >= config.metaAhorro && ahorroDespues < config.metaAhorro) {
      alertas.push(
        `🚨 Con este gasto, el ahorro proyectado del mes ($${formatearMonto(ahorroDespues)}) quedó por debajo de la meta ($${formatearMonto(config.metaAhorro)}).`
      );
    }
  }

  return alertas;
}

module.exports = { calcularAlertas };
