import axios from 'axios';

export async function obtenerGastos(filtros = {}) {
  const { data } = await axios.get('/api/gastos', { params: filtros });
  return data;
}

export async function obtenerResumen(filtros = {}) {
  const { data } = await axios.get('/api/gastos/resumen', { params: filtros });
  return data;
}
