import useCountUp from '../hooks/useCountUp';

function formatearMoneda(valor) {
  return `$${(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export default function ProximoMes({ pendientesProximoMes }) {
  const totalAnimado = useCountUp(pendientesProximoMes?.total || 0);
  if (!pendientesProximoMes) return null;

  const { mes, cantidad, porCategoria } = pendientesProximoMes;
  const categorias = Object.entries(porCategoria || {}).sort((a, b) => b[1] - a[1]);

  return (
    <div className="card resumen-mes">
      <h2>Pendiente para {mes}</h2>
      {cantidad === 0 ? (
        <p className="vacio">Todavía no hay gastos comprometidos para el mes que viene.</p>
      ) : (
        <>
          <p className="total">{formatearMoneda(Math.round(totalAnimado))}</p>
          <p className="config-familia-ayuda" style={{ margin: '0 0 10px' }}>
            {cantidad} gasto{cantidad === 1 ? '' : 's'} ya comprometido{cantidad === 1 ? '' : 's'} (incluye cuotas en curso y algunas estimadas)
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
