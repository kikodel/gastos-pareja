import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORES = ['#4f8ef7', '#f77f4f', '#4fc97f', '#f7c94f', '#a94ff7', '#f74f9c', '#4ff7e4', '#c9974f', '#9e9e9e'];

export default function GraficoCategorias({ porCategoria }) {
  if (!porCategoria || porCategoria.length === 0) {
    return (
      <div className="card">
        <h2>Gasto por categoria</h2>
        <p className="vacio">Sin datos para el periodo seleccionado.</p>
      </div>
    );
  }

  const total = porCategoria.reduce((suma, c) => suma + c.total, 0);

  return (
    <div className="card">
      <h2>Gasto por categoria</h2>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={porCategoria}
            dataKey="total"
            nameKey="categoria"
            cx="50%"
            cy="50%"
            outerRadius={95}
          >
            {porCategoria.map((entrada, index) => (
              <Cell key={entrada.categoria} fill={COLORES[index % COLORES.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(valor) => `$${valor.toLocaleString('es-AR')}`} />
          <Legend
            formatter={(value, entrada) => {
              const porcentaje = total > 0 ? ((entrada.payload.total / total) * 100).toFixed(0) : 0;
              return `${value} ${porcentaje}%`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
