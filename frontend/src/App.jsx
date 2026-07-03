import { useEffect, useMemo, useState } from 'react';
import { obtenerGastos, obtenerResumen, obtenerGrupos } from './api/gastosClient';
import Filtros from './components/Filtros';
import ResumenMes from './components/ResumenMes';
import GraficoCategorias from './components/GraficoCategorias';
import EvolucionMensual from './components/EvolucionMensual';
import ComparacionPersonas from './components/ComparacionPersonas';
import TablaGastos from './components/TablaGastos';

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export default function App() {
  const [grupos, setGrupos] = useState([]);
  const [filtros, setFiltros] = useState({ grupo: '', mes: mesActual(), categoria: '', persona: '' });
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [gastosTotales, setGastosTotales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    obtenerGrupos()
      .then((lista) => {
        setGrupos(lista);
        if (lista.length > 0) {
          setFiltros((actual) => ({ ...actual, grupo: actual.grupo || lista[0].id }));
        }
      })
      .catch((err) => {
        console.error(err);
        setError('No se pudieron cargar los grupos familiares.');
      });
  }, []);

  useEffect(() => {
    if (!filtros.grupo) return undefined;

    let cancelado = false;
    setCargando(true);
    setError(null);

    Promise.all([obtenerGastos(filtros), obtenerResumen(filtros)])
      .then(([listaGastos, datosResumen]) => {
        if (cancelado) return;
        setGastos(listaGastos);
        setResumen(datosResumen);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error(err);
        setError('No se pudieron cargar los gastos. Revisa que el backend este corriendo.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [filtros]);

  useEffect(() => {
    if (!filtros.grupo) return;
    obtenerGastos({ grupo: filtros.grupo }).then(setGastosTotales).catch(() => {});
  }, [filtros.grupo]);

  const personasDisponibles = useMemo(() => {
    const unicas = new Set(gastosTotales.map((g) => g.persona).filter(Boolean));
    return Array.from(unicas);
  }, [gastosTotales]);

  const grupoActual = grupos.find((g) => g.id === filtros.grupo);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-brand">
          <span className="app-header-badge">$</span>
          <div>
            <h1>Gastos Familiares</h1>
            <p className="app-header-subtitle">
              {grupoActual ? grupoActual.nombre : 'Panel de control de gastos'}
            </p>
          </div>
        </div>
      </header>

      <Filtros
        filtros={filtros}
        onChange={setFiltros}
        personasDisponibles={personasDisponibles}
        grupos={grupos}
      />

      {error && <p className="error">{error}</p>}
      {cargando && <p className="cargando">Cargando...</p>}

      {!cargando && !error && resumen && (
        <div className="grid">
          <ResumenMes totalMes={resumen.totalMes} totalMesAnterior={resumen.totalMesAnterior} />
          <GraficoCategorias porCategoria={resumen.porCategoria} />
          <EvolucionMensual evolucionMensual={resumen.evolucionMensual} />
          <ComparacionPersonas porPersona={resumen.porPersona} />
          <TablaGastos gastos={gastos} />
        </div>
      )}
    </div>
  );
}
