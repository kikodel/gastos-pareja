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

function formatearMoneda(valor) {
  return `$${valor.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
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

  const ingresoNumerico = parseFloat(form.ingresoMensual);
  const hayIngreso = !Number.isNaN(ingresoNumerico) && ingresoNumerico > 0;

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
          {hayIngreso
            ? 'Definí cada límite como % del ingreso mensual. Dejá en blanco las categorías sin límite.'
            : 'Cargá el ingreso mensual arriba para poder definir límites como % del ingreso.'}
        </p>

        <div className="config-familia-grid">
          {CATEGORIAS.map((cat) => {
            const porcentaje = parseFloat(form.limites[cat]);
            const tieneValor = !Number.isNaN(porcentaje) && porcentaje > 0;
            return (
              <label key={cat}>
                {cat}
                <div className="config-limite-input">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    placeholder="Sin límite"
                    disabled={!hayIngreso}
                    value={form.limites[cat]}
                    onChange={(e) => actualizarLimite(cat, e.target.value)}
                  />
                  <span className="config-limite-sufijo">%</span>
                </div>
                {hayIngreso && tieneValor && (
                  <span className="config-limite-equivalente">
                    = {formatearMoneda(ingresoNumerico * (porcentaje / 100))}
                  </span>
                )}
              </label>
            );
          })}
        </div>

        {mensaje && <p className={mensaje.tipo === 'error' ? 'error' : 'exito'}>{mensaje.texto}</p>}

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </form>
    </div>
  );
}
