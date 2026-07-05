import { CATEGORIAS } from '../constants';

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

function ChipGroup({ label, opciones, valor, onSelect }) {
  return (
    <div className="filtro-chips">
      <span className="filtro-chips-label">{label}</span>
      <div className="filtro-chips-scroll">
        {opciones.map((op) => (
          <button
            key={op.value}
            type="button"
            className={`chip${valor === op.value ? ' chip-activo' : ''}`}
            onClick={() => onSelect(op.value)}
          >
            {op.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Filtros({ filtros, onChange, personasDisponibles, grupos, bloqueado }) {
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

      {!bloqueado && (
        <>
          <ChipGroup
            label="Mes"
            valor={filtros.mes}
            onSelect={(mes) => onChange({ ...filtros, mes })}
            opciones={meses.map((mes) => ({ value: mes, label: mes }))}
          />

          <ChipGroup
            label="Categoria"
            valor={filtros.categoria}
            onSelect={(categoria) => onChange({ ...filtros, categoria })}
            opciones={[{ value: '', label: 'Todas' }, ...CATEGORIAS.map((cat) => ({ value: cat, label: cat }))]}
          />

          <ChipGroup
            label="Persona"
            valor={filtros.persona}
            onSelect={(persona) => onChange({ ...filtros, persona })}
            opciones={[
              { value: '', label: 'Ambos' },
              ...personasDisponibles.map((persona) => ({ value: persona, label: persona })),
            ]}
          />
        </>
      )}
    </div>
  );
}
