import axios from 'axios';

export async function obtenerGastos(filtros = {}) {
  const { data } = await axios.get('/api/gastos', { params: filtros });
  return data;
}

export async function obtenerResumen(filtros = {}) {
  const { data } = await axios.get('/api/gastos/resumen', { params: filtros });
  return data;
}

export async function obtenerGrupos() {
  const { data } = await axios.get('/api/grupos');
  return data;
}

export async function verificarPasswordGrupo(grupoId, password) {
  const { data } = await axios.get(`/api/grupos/${grupoId}/verificar`, { params: { password } });
  return data.ok === true;
}

export async function obtenerConfig(grupo, password) {
  const { data } = await axios.get('/api/config', { params: { grupo, password } });
  return data;
}

export async function guardarConfigGrupo(grupo, password, config) {
  const { data } = await axios.put('/api/config', { password, ...config }, { params: { grupo } });
  return data;
}

export async function eliminarGasto(grupo, password, fila) {
  const { data } = await axios.delete(`/api/gastos/${fila}`, { params: { grupo, password } });
  return data;
}

export async function importarPdf(grupo, password, archivo) {
  const formData = new FormData();
  formData.append('file', archivo);
  const { data } = await axios.post('/api/gastos/importar-pdf', formData, {
    params: { grupo, password },
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.movimientos;
}

export async function confirmarImportacion(grupo, password, gastos) {
  const { data } = await axios.post('/api/gastos/confirmar-importacion', { gastos }, { params: { grupo, password } });
  return data;
}
