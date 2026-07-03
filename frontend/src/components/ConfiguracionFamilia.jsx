import { useEffect, useState } from 'react';
import { CATEGORIAS } from '../constants';

function aFormulario(config) {
  return {
    ingresoMensual: config?.ingresoMensual ?? '',
    metaAhorro: config?.metaAhorro ?? '',
    limites: CATEGORIAS.reduce((acc, cat) => {
      acc[cat] = config?.limites?.[cat] ?? '';
      return acc;
    }, {}),
  };
}

export default function ConfiguracionFamilia({ config, onGuardar, onCerrar }) {
  const [form, setForm] = useState(() => aFormulario(config));
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    setForm(aFormulario(config));
  }, [config]);

  function actualizarLimite(categoria, valor) {
    setForm((actual) => ({ ...actual, limites: { ...actual.limites, [categoria]: valor } }));
  }

  async function manejarSubmit(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje(null);
    try {
      await onGuardar({
        ingresoMensual: form.ingresoMensual === '' ? null : parseFloat(form.ingresoMensual),
        metaAhorro: form.metaAhorro === '' ? null : parseFloat(form.metaAhorro),
        limites: form.limites,
      });
      setMensaje({ tipo: 'ok', texto: 'Configuración guardada.' });
    } catch (err) {
      console.error(err);
      setMensaje({ tipo: 'error', texto: 'No se pudo guardar. Intentá de nuevo.' });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card config-familia">
      <div className="config-familia-header">
        <h2>Configuración</h2>
        <button type="button" className="link-button" onClick={onCerrar}>
          Cerrar
        </button>
      </div>

      <form onSubmit={manejarSubmit}>
        <div className="config-familia-grid">
          <label>
            Ingreso mensual
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 800000"
              value={form.ingresoMensual}
              onChange={(e) => setForm({ ...form, ingresoMensual: e.target.value })}
            />
          </label>

          <label>
            Meta de ahorro mensual
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Ej. 100000"
              value={form.metaAhorro}
              onChange={(e) => setForm({ ...form, metaAhorro: e.target.value })}
            />
          </label>
        </div>

        <h3>Límites por categoría (opcional)</h3>
        <p className="config-familia-ayuda">
          Dejá en blanco las categorías sin límite. Se avisa por WhatsApp y en el dashboard cuando se supera.
        </p>

        <div className="config-familia-grid">
          {CATEGORIAS.map((cat) => (
            <label key={cat}>
              {cat}
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Sin límite"
                value={form.limites[cat]}
                onChange={(e) => actualizarLimite(cat, e.target.value)}
              />
            </label>
          ))}
        </div>

        {mensaje && <p className={mensaje.tipo === 'error' ? 'error' : 'exito'}>{mensaje.texto}</p>}

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  );
}
