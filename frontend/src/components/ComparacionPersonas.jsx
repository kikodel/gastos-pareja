import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ComparacionPersonas({ porPersona }) {
  const datos = Object.entries(porPersona || {}).map(([persona, total]) => ({ persona, total }));

  if (datos.length === 0) {
    return (
      <div className="card">
        <h2>Comparacion entre personas</h2>
        <p className="vacio">Sin datos para el periodo seleccionado.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Comparacion entre personas</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="persona" />
          <YAxis />
          <Tooltip formatter={(valor) => `$${valor.toLocaleString('es-AR')}`} />
          <Bar dataKey="total" fill="#4fc97f" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
