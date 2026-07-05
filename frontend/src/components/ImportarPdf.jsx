import { useEffect, useState } from 'react';
import { CATEGORIAS } from '../constants';

function prepararFilas(extraidos, personasDisponibles) {
  return extraidos.map((mov) => ({
    ...mov,
    fecha: mov.fecha || new Date().toISOString().slice(0, 10),
    persona: personasDisponibles[0] || '',
    incluir: true,
  }));
}

export default function ImportarPdf({ personasDisponibles, onExtraer, onConfirmar, onCerrar, onCargarPendiente }) {
  const [archivo, setArchivo] = useState(null);
  const [movimientos, setMovimientos] = useState(null);
  const [vienePendiente, setVienePendiente] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    onCargarPendiente()
      .then((pendientes) => {
        if (pendientes && pendientes.length > 0) {
          setMovimientos(prepararFilas(pendientes, personasDisponibles));
          setVienePendiente(true);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function manejarExtraer() {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    try {
      const extraidos = await onExtraer(archivo);
      setMovimientos(prepararFilas(extraidos, personasDisponibles));
      setVienePendiente(false);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'No se pudo procesar el PDF. Probá con otro archivo.');
    } finally {
      setCargando(false);
    }
  }

  function actualizarFila(indice, campo, valor) {
    setMovimientos((actual) => actual.map((mov, i) => (i === indice ? { ...mov, [campo]: valor } : mov)));
  }

  function aplicarPersonaATodos(persona) {
    setMovimientos((actual) => actual.map((mov) => ({ ...mov, persona })));
  }

  async function manejarConfirmar() {
    const seleccionados = movimientos.filter((m) => m.incluir);
    if (seleccionados.length === 0) return;

    setGuardando(true);
    setError(null);
    try {
      const res = await onConfirmar(
        seleccionados.map(({ fecha, persona, categoria, descripcion, monto }) => ({
          fecha,
          persona,
          categoria,
          descripcion,
          monto,
        }))
      );
      setResultado(`Se importaron ${res.importados} gastos correctamente.`);
      setMovimientos(null);
      setArchivo(null);
    } catch (err) {
      console.error(err);
      setError('No se pudo completar la importación. Intentá de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card importar-pdf">
      <div className="config-familia-header">
        <h2>Importar resumen de tarjeta</h2>
        <button type="button" className="link-button" onClick={onCerrar}>
          Cerrar
        </button>
      </div>

      {!movimientos && (
        <div className="importar-pdf-upload">
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setArchivo(e.target.files[0] || null)}
          />
          <button type="button" disabled={!archivo || cargando} onClick={manejarExtraer}>
            {cargando ? 'Leyendo PDF...' : 'Extraer movimientos'}
          </button>
        </div>
      )}

      {error && <p className="error">{error}</p>}
      {resultado && <p className="exito">{resultado}</p>}

      {movimientos && (
        <>
          {vienePendiente && (
            <p className="exito">📲 Estos movimientos vienen de un resumen que mandaste por WhatsApp.</p>
          )}
          <p className="config-familia-ayuda">
            Revisá y corregí lo que haga falta antes de confirmar. Desmarcá las filas que no correspondan.
          </p>

          {personasDisponibles.length > 0 && (
            <label className="importar-pdf-persona-global">
              Asignar persona a todos:
              <select onChange={(e) => aplicarPersonaATodos(e.target.value)} defaultValue="">
                <option value="" disabled>
                  Elegir...
                </option>
                {personasDisponibles.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="tabla-gastos-scroll">
            <table className="importar-pdf-tabla">
              <thead>
                <tr>
                  <th></th>
                  <th>Fecha</th>
                  <th>Descripcion</th>
                  <th>Monto</th>
                  <th>Categoria</th>
                  <th>Persona</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="checkbox"
                        checked={mov.incluir}
                        onChange={(e) => actualizarFila(i, 'incluir', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        value={mov.fecha}
                        onChange={(e) => actualizarFila(i, 'fecha', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={mov.descripcion}
                        onChange={(e) => actualizarFila(i, 'descripcion', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={mov.monto}
                        onChange={(e) => actualizarFila(i, 'monto', e.target.value)}
                      />
                    </td>
                    <td>
                      <select value={mov.categoria} onChange={(e) => actualizarFila(i, 'categoria', e.target.value)}>
                        {CATEGORIAS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select value={mov.persona} onChange={(e) => actualizarFila(i, 'persona', e.target.value)}>
                        <option value="">Elegir...</option>
                        {personasDisponibles.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" disabled={guardando} onClick={manejarConfirmar}>
            {guardando ? 'Importando...' : `Confirmar importación (${movimientos.filter((m) => m.incluir).length})`}
          </button>
        </>
      )}
    </div>
  );
}
