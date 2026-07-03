import { useEffect, useMemo, useState } from 'react';
import { obtenerGastos, obtenerResumen, obtenerGrupos, verificarPasswordGrupo } from './api/gastosClient';
import Filtros from './components/Filtros';
import PasswordGate from './components/PasswordGate';
import ResumenMes from './components/ResumenMes';
import GraficoCategorias from './components/GraficoCategorias';
import EvolucionMensual from './components/EvolucionMensual';
import ComparacionPersonas from './components/ComparacionPersonas';
import TablaGastos from './components/TablaGastos';

function mesActual() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

function cargarPasswordsGuardadas() {
  try {
    return JSON.parse(sessionStorage.getItem('gp_passwords') || '{}');
  } catch {
    return {};
  }
}

export default function App() {
  const [grupos, setGrupos] = useState([]);
  const [filtros, setFiltros] = useState({ grupo: '', mes: mesActual(), categoria: '', persona: '' });
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [gastosTotales, setGastosTotales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [passwords, setPasswords] = useState(cargarPasswordsGuardadas);
  const [passwordError, setPasswordError] = useState(null);
  const [verificandoPassword, setVerificandoPassword] = useState(false);

  useEffect(() => {
    sessionStorage.setItem('gp_passwords', JSON.stringify(passwords));
  }, [passwords]);

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

  const grupoActual = grupos.find((g) => g.id === filtros.grupo);
  const necesitaPassword = Boolean(grupoActual?.requierePassword);
  const autenticado = Boolean(filtros.grupo) && (!necesitaPassword || Boolean(passwords[filtros.grupo]));

  useEffect(() => {
    if (!filtros.grupo || !autenticado) return undefined;

    let cancelado = false;
    setCargando(true);
    setError(null);

    const params = { ...filtros, password: passwords[filtros.grupo] };

    Promise.all([obtenerGastos(params), obtenerResumen(params)])
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
  }, [filtros, autenticado, passwords]);

  useEffect(() => {
    if (!filtros.grupo || !autenticado) return;
    obtenerGastos({ grupo: filtros.grupo, password: passwords[filtros.grupo] })
      .then(setGastosTotales)
      .catch(() => {});
  }, [filtros.grupo, autenticado, passwords]);

  const personasDisponibles = useMemo(() => {
    const unicas = new Set(gastosTotales.map((g) => g.persona).filter(Boolean));
    return Array.from(unicas);
  }, [gastosTotales]);

  function manejarSubmitPassword(password) {
    setVerificandoPassword(true);
    setPasswordError(null);
    verificarPasswordGrupo(filtros.grupo, password)
      .then((ok) => {
        if (ok) {
          setPasswords((actual) => ({ ...actual, [filtros.grupo]: password }));
        } else {
          setPasswordError('Contraseña incorrecta.');
        }
      })
      .catch(() => setPasswordError('No se pudo verificar la contraseña. Intentá de nuevo.'))
      .finally(() => setVerificandoPassword(false));
  }

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
        bloqueado={!autenticado}
      />

      {!autenticado && grupoActual && (
        <PasswordGate
          grupoNombre={grupoActual.nombre}
          error={passwordError}
          cargando={verificandoPassword}
          onSubmit={manejarSubmitPassword}
        />
      )}

      {autenticado && error && <p className="error">{error}</p>}
      {autenticado && cargando && <p className="cargando">Cargando...</p>}

      {autenticado && !cargando && !error && resumen && (
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
