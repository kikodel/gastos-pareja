import { useEffect, useMemo, useState } from 'react';
import { obtenerGastos, obtenerResumen } from './api/gastosClient';
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
  const [filtros, setFiltros] = useState({ mes: mesActual(), categoria: '', persona: '' });
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [gastosTotales, setGastosTotales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    obtenerGastos({}).then(setGastosTotales).catch(() => {});
  }, []);

  const personasDisponibles = useMemo(() => {
    const unicas = new Set(gastosTotales.map((g) => g.persona).filter(Boolean));
    return Array.from(unicas);
  }, [gastosTotales]);

  return (
    <div className="app">
      <header>
        <h1>Gastos de la pareja</h1>
      </header>

      <Filtros filtros={filtros} onChange={setFiltros} personasDisponibles={personasDisponibles} />

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
