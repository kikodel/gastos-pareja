const CATEGORIAS = [
  'Supermercado',
  'Comida afuera',
  'Transporte',
  'Servicios/Cuentas',
  'Salud',
  'Ocio',
  'Ropa',
  'Hogar',
  'Otros',
];

function generarMesesDisponibles(cantidad = 12) {
  const meses = [];
  const hoy = new Date();
  for (let i = 0; i < cantidad; i += 1) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const valor = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    meses.push(valor);
  }
  return meses;
}

export default function Filtros({ filtros, onChange, personasDisponibles, grupos }) {
  const meses = generarMesesDisponibles();

  return (
    <div className="filtros">
      <label>
        Grupo familiar
        <select
          value={filtros.grupo}
          onChange={(e) => onChange({ ...filtros, grupo: e.target.value, persona: '' })}
        >
          {grupos.map((grupo) => (
            <option key={grupo.id} value={grupo.id}>
              {grupo.nombre}
            </option>
          ))}
        </select>
      </label>

      <label>
        Mes
        <select
          value={filtros.mes}
          onChange={(e) => onChange({ ...filtros, mes: e.target.value })}
        >
          {meses.map((mes) => (
            <option key={mes} value={mes}>
              {mes}
            </option>
          ))}
        </select>
      </label>

      <label>
        Categoria
        <select
          value={filtros.categoria}
          onChange={(e) => onChange({ ...filtros, categoria: e.target.value })}
        >
          <option value="">Todas</option>
          {CATEGORIAS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </label>

      <label>
        Persona
        <select
          value={filtros.persona}
          onChange={(e) => onChange({ ...filtros, persona: e.target.value })}
        >
          <option value="">Ambos</option>
          {personasDisponibles.map((persona) => (
            <option key={persona} value={persona}>
              {persona}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
