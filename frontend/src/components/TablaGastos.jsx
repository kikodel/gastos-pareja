function formatearMoneda(valor) {
  return `$${(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export default function TablaGastos({ gastos }) {
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
              </tr>
            </thead>
            <tbody>
              {gastos.map((gasto, index) => (
                <tr key={`${gasto.fecha}-${index}`}>
                  <td>{gasto.fecha}</td>
                  <td>{gasto.persona}</td>
                  <td>{gasto.categoria}</td>
                  <td>{gasto.descripcion}</td>
                  <td>{formatearMoneda(gasto.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
