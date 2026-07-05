import useCountUp from '../hooks/useCountUp';

function formatearMoneda(valor) {
  return `$${(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export default function ResumenMes({ totalMes, totalMesAnterior }) {
  const totalAnimado = useCountUp(totalMes);
  let variacion = null;
  if (totalMesAnterior !== null && totalMesAnterior !== undefined && totalMesAnterior > 0) {
    variacion = ((totalMes - totalMesAnterior) / totalMesAnterior) * 100;
  }

  return (
    <div className="card resumen-mes">
      <h2>Total del mes</h2>
      <p className="total">{formatearMoneda(Math.round(totalAnimado))}</p>
      {variacion !== null && (
        <p className={variacion >= 0 ? 'variacion aumento' : 'variacion disminucion'}>
          {variacion >= 0 ? '▲' : '▼'} {Math.abs(variacion).toFixed(1)}% vs mes anterior
        </p>
      )}
    </div>
  );
}
