import { useState } from 'react';

function formatearMoneda(valor) {
  return `$${(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export default function TablaGastos({ gastos, onEliminar }) {
  const [eliminandoFila, setEliminandoFila] = useState(null);

  async function manejarClickEliminar(gasto) {
    const confirmado = window.confirm(
      `¿Eliminar el gasto de ${gasto.persona} por ${formatearMoneda(gasto.monto)} (${gasto.descripcion})?`
    );
    if (!confirmado) return;

    setEliminandoFila(gasto.fila);
    try {
      await onEliminar(gasto.fila);
    } finally {
      setEliminandoFila(null);
    }
  }

  return (
    <div className="card tabla-gastos">
      <h2>Ultimos gastos</h2>
      {gastos.length === 0 ? (
        <p className="vacio">No hay gastos registrados para el periodo seleccionado.</p>
      ) : (
        <div className="tabla-gastos-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Persona</th>
                <th>Categoria</th>
                <th>Descripcion</th>
                <th>Monto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto) => (
                <tr key={gasto.fila}>
                  <td>{gasto.fecha}</td>
                  <td>{gasto.persona}</td>
                  <td>{gasto.categoria}</td>
                  <td>{gasto.descripcion}</td>
                  <td>{formatearMoneda(gasto.monto)}</td>
                  <td>
                    <button
                      type="button"
                      className="eliminar-gasto"
                      disabled={eliminandoFila === gasto.fila}
                      onClick={() => manejarClickEliminar(gasto)}
                      title="Eliminar gasto"
                    >
                      {eliminandoFila === gasto.fila ? '...' : '🗑️'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
