function formatearMoneda(valor) {
  return `$${(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export default function ProximoMes({ pendientesProximoMes }) {
  if (!pendientesProximoMes) return null;

  const { mes, total, cantidad, porCategoria } = pendientesProximoMes;
  const categorias = Object.entries(porCategoria || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="card resumen-mes">
      <h2>Pendiente para {mes}</h2>
      {cantidad === 0 ? (
        <p className="vacio">Todavía no hay gastos comprometidos para el mes que viene.</p>
      ) : (
        <>
          <p className="total">{formatearMoneda(total)}</p>
          <p className="config-familia-ayuda" style={{ margin: '0 0 10px' }}>
            {cantidad} gasto{cantidad === 1 ? '' : 's'} ya comprometido{cantidad === 1 ? '' : 's'} (mayormente cuotas en curso)
          </p>
          <ul className="proyeccion-lista">
            {categorias.map(([categoria, monto]) => (
              <li key={categoria}>
                <span>{categoria}</span>
                <strong>{formatearMoneda(monto)}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
