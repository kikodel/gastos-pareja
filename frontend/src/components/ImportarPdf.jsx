import { useEffect, useState } from 'react';
import { CATEGORIAS } from '../constants';

function normalizarDescripcion(descripcion) {
  return (descripcion || '')
    .replace(/\s*\(cuota \d+\/\d+\)\s*$/i, '')
    .replace(/\s*\(d[eé]bito autom[aá]tico\)\s*$/i, '')
    .trim()
    .toUpperCase();
}

function esPosibleDuplicado(mov, gastosExistentes) {
  const descNormalizada = normalizarDescripcion(mov.descripcion);
  const mesMov = (mov.fecha || new Date().toISOString().slice(0, 10)).slice(0, 7);
  const monto = parseFloat(mov.monto);
  if (!descNormalizada || Number.isNaN(monto)) return false;

  return (gastosExistentes || []).some((g) => {
    const mismoMes = (g.fecha || '').slice(0, 7) === mesMov;
    const mismoMonto = Math.abs(g.monto - monto) < 1;
    const mismaDescripcion = normalizarDescripcion(g.descripcion) === descNormalizada;
    return mismoMes && mismoMonto && mismaDescripcion;
  });
}

function prepararFilas(extraidos, personasDisponibles, gastosExistentes) {
  return extraidos.map((mov) => {
    const detectoCuota =
      mov.cuotaActual !== null && mov.cuotaActual !== undefined && mov.cuotasTotal !== null && mov.cuotasTotal !== undefined;
    const posibleDuplicado = esPosibleDuplicado(mov, gastosExistentes);
    return {
      ...mov,
      fecha: mov.fecha || new Date().toISOString().slice(0, 10),
      persona: personasDisponibles[0] || '',
      incluir: !posibleDuplicado,
      posibleDuplicado,
      tipo: detectoCuota ? 'cuota' : 'unico',
      cuotaActual: detectoCuota ? mov.cuotaActual : '',
      cuotasTotal: detectoCuota ? mov.cuotasTotal : '',
    };
  });
}

export default function ImportarPdf({ personasDisponibles, gastosExistentes, onExtraer, onConfirmar, onCerrar, onCargarPendiente }) {
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
          setMovimientos(prepararFilas(pendientes, personasDisponibles, gastosExistentes));
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
      setMovimientos(prepararFilas(extraidos, personasDisponibles, gastosExistentes));
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

  function quitarFila(indice) {
    setMovimientos((actual) => actual.filter((_, i) => i !== indice));
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
        seleccionados.map(({ fecha, persona, categoria, descripcion, monto, tipo, cuotaActual, cuotasTotal }) => ({
          fecha,
          persona,
          categoria,
          descripcion,
          monto,
          tipo,
          cuotaActual: tipo === 'cuota' ? cuotaActual : null,
          cuotasTotal: tipo === 'cuota' ? cuotasTotal : null,
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
            Revisá y corregí lo que haga falta antes de confirmar. Desmarcá o quitá las filas que no correspondan. Si
            marcás "Cuotas", se generan automáticamente las filas de los meses que faltan.
          </p>

          {movimientos.some((m) => m.posibleDuplicado) && (
            <p className="aviso-duplicado">
              ⚠️ Las filas resaltadas parecen ya estar cargadas este mes (misma descripción y monto). Las dejamos
              desmarcadas por las dudas — tildalas si en realidad son gastos distintos.
            </p>
          )}

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
                  <th>Tipo</th>
                  <th>Cuota</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((mov, i) => (
                  <tr key={i} className={mov.posibleDuplicado ? 'fila-duplicada' : ''}>
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
                      {mov.posibleDuplicado && (
                        <span className="chip-duplicado" title="Ya existe un gasto similar este mes">
                          ⚠️ posible duplicado
                        </span>
                      )}
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
                    <td>
                      <select value={mov.tipo} onChange={(e) => actualizarFila(i, 'tipo', e.target.value)}>
                        <option value="unico">Cuota única</option>
                        <option value="cuota">Cuotas</option>
                        <option value="debito">Débito automático</option>
                      </select>
                    </td>
                    <td>
                      {mov.tipo === 'cuota' && (
                        <div className="importar-pdf-cuota-inputs">
                          <input
                            type="number"
                            min="1"
                            placeholder="Actual"
                            value={mov.cuotaActual}
                            onChange={(e) => actualizarFila(i, 'cuotaActual', e.target.value)}
                          />
                          <span>/</span>
                          <input
                            type="number"
                            min="1"
                            placeholder="Total"
                            value={mov.cuotasTotal}
                            onChange={(e) => actualizarFila(i, 'cuotasTotal', e.target.value)}
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="eliminar-gasto"
                        title="Quitar de la lista"
                        onClick={() => quitarFila(i)}
                      >
                        🗑️
                      </button>
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
