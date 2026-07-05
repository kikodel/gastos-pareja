function calcularMontosPorCuota(montoTotal, cantidadCuotas) {
  const base = Math.floor((montoTotal / cantidadCuotas) * 100) / 100;
  const montos = new Array(cantidadCuotas).fill(base);
  const sumaBase = base * cantidadCuotas;
  const diferencia = Math.round((montoTotal - sumaBase) * 100) / 100;
  montos[montos.length - 1] = Math.round((montos[montos.length - 1] + diferencia) * 100) / 100;
  return montos;
}

function sumarMeses(fechaBase, cantidadMeses) {
  const dia = fechaBase.getDate();
  const resultado = new Date(fechaBase.getFullYear(), fechaBase.getMonth() + cantidadMeses, 1);
  const ultimoDiaDelMes = new Date(resultado.getFullYear(), resultado.getMonth() + 1, 0).getDate();
  resultado.setDate(Math.min(dia, ultimoDiaDelMes));
  resultado.setHours(fechaBase.getHours(), fechaBase.getMinutes(), fechaBase.getSeconds());
  return resultado;
}

function generarFechasCuotas(fechaBase, cantidadCuotas) {
  const fechas = [];
  for (let i = 0; i < cantidadCuotas; i += 1) {
    fechas.push(sumarMeses(fechaBase, i));
  }
  return fechas;
}

module.exports = { calcularMontosPorCuota, generarFechasCuotas };
