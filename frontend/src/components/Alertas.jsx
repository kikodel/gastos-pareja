function formatearMoneda(valor) {
  return `$${(valor || 0).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
}

export default function Alertas({ resumen, config }) {
  if (!resumen || !config) return null;

  const alertasCategoria = (resumen.porCategoria || [])
    .filter((c) => config.limites?.[c.categoria] && config.ingresoMensual)
    .map((c) => {
      const porcentaje = config.limites[c.categoria];
      const limite = config.ingresoMensual * (porcentaje / 100);
      return { categoria: c.categoria, total: c.total, porcentaje, limite };
    })
    .filter((c) => c.total >= c.limite)
    .map((c) => ({
      texto: `${c.categoria}: gastaron ${formatearMoneda(c.total)} de ${formatearMoneda(c.limite)} (${c.porcentaje}% del ingreso)`,
    }));

  const alertasAhorro = [];
  if (config.ingresoMensual && config.metaAhorro) {
    const ahorroProyectado = config.ingresoMensual - resumen.totalMes;
    if (ahorroProyectado < config.metaAhorro) {
      alertasAhorro.push({
        texto: `Ahorro proyectado del mes: ${formatearMoneda(ahorroProyectado)} (meta: ${formatearMoneda(config.metaAhorro)})`,
      });
    }
  }

  const alertas = [...alertasCategoria, ...alertasAhorro];
  if (alertas.length === 0) return null;

  return (
    <div className="alertas">
      {alertas.map((alerta) => (
        <div key={alerta.texto} className="alerta-item">
          🚨 {alerta.texto}
        </div>
      ))}
    </div>
  );
}
