import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function EvolucionMensual({ evolucionMensual }) {
  if (!evolucionMensual || evolucionMensual.length === 0) {
    return (
      <div className="card">
        <h2>Evolucion mensual</h2>
        <p className="vacio">Todavia no hay suficientes datos.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Evolucion mensual</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={evolucionMensual}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip formatter={(valor) => `$${valor.toLocaleString('es-AR')}`} />
          <Line type="monotone" dataKey="total" stroke="#4f8ef7" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
