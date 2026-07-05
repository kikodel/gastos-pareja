function formatearMoneda(valor) {
  return `$${(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export default function CuotasActivas({ cuotasActivas }) {
  return (
    <div className="card cuotas-activas">
      <h2>Cuotas activas</h2>
      {!cuotasActivas || cuotasActivas.length === 0 ? (
        <p className="vacio">No hay compras en cuotas en curso.</p>
      ) : (
        <div className="tabla-gastos-scroll">
          <table>
            <thead>
              <tr>
                <th>Descripcion</th>
                <th>Persona</th>
                <th>Progreso</th>
                <th>Cuota</th>
                <th>Restante</th>
              </tr>
            </thead>
            <tbody>
              {cuotasActivas.map((c) => (
                <tr key={`${c.descripcion}-${c.persona}`}>
                  <td>
                    {c.descripcion} <span className="config-familia-ayuda">({c.categoria})</span>
                  </td>
                  <td>{c.persona}</td>
                  <td>
                    {c.cuotaActual}/{c.cuotasTotal}
                  </td>
                  <td>{formatearMoneda(c.montoPorCuota)}</td>
                  <td>
                    {formatearMoneda(c.montoRestante)} ({c.cuotasRestantes} cuota{c.cuotasRestantes === 1 ? '' : 's'})
                    {c.proyectado && <span className="config-familia-ayuda"> (estimado)</span>}
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
