import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  obtenerGastos,
  obtenerResumen,
  obtenerGrupos,
  verificarPasswordGrupo,
  obtenerConfig,
  guardarConfigGrupo,
  eliminarGasto,
  importarPdf,
  confirmarImportacion,
} from './api/gastosClient';
import Filtros from './components/Filtros';
import PasswordGate from './components/PasswordGate';
import ResumenMes from './components/ResumenMes';
import GraficoCategorias from './components/GraficoCategorias';
import EvolucionMensual from './components/EvolucionMensual';
import ComparacionPersonas from './components/ComparacionPersonas';
import TablaGastos from './components/TablaGastos';
import Alertas from './components/Alertas';
import ConfiguracionFamilia from './components/ConfiguracionFamilia';
import ImportarPdf from './components/ImportarPdf';

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
  const [config, setConfig] = useState(null);
  const [mostrarConfig, setMostrarConfig] = useState(false);
  const [mostrarImportarPdf, setMostrarImportarPdf] = useState(false);
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

  const cargarGastosYResumen = useCallback(
    (paramsExtra = {}) => {
      const params = { ...filtros, password: passwords[filtros.grupo], ...paramsExtra };
      return Promise.all([obtenerGastos(params), obtenerResumen(params)]).then(
        ([listaGastos, datosResumen]) => {
          setGastos(listaGastos);
          setResumen(datosResumen);
        }
      );
    },
    [filtros, passwords]
  );

  useEffect(() => {
    if (!filtros.grupo || !autenticado) return undefined;

    let cancelado = false;
    setCargando(true);
    setError(null);

    cargarGastosYResumen()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, autenticado, passwords]);

  useEffect(() => {
    if (!filtros.grupo || !autenticado) return;
    obtenerGastos({ grupo: filtros.grupo, password: passwords[filtros.grupo] })
      .then(setGastosTotales)
      .catch(() => {});
  }, [filtros.grupo, autenticado, passwords]);

  useEffect(() => {
    if (!filtros.grupo || !autenticado) {
      setConfig(null);
      return;
    }
    obtenerConfig(filtros.grupo, passwords[filtros.grupo])
      .then(setConfig)
      .catch((err) => console.error('No se pudo cargar la configuración', err));
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

  async function manejarGuardarConfig(nuevoConfig) {
    const guardado = await guardarConfigGrupo(filtros.grupo, passwords[filtros.grupo], nuevoConfig);
    setConfig(guardado);
  }

  async function manejarEliminarGasto(fila) {
    try {
      await eliminarGasto(filtros.grupo, passwords[filtros.grupo], fila);
      await cargarGastosYResumen();
    } catch (err) {
      console.error(err);
      setError('No se pudo eliminar el gasto. Intentá de nuevo.');
    }
  }

  function manejarExtraerPdf(archivo) {
    return importarPdf(filtros.grupo, passwords[filtros.grupo], archivo);
  }

  async function manejarConfirmarImportacion(gastosSeleccionados) {
    const resultado = await confirmarImportacion(filtros.grupo, passwords[filtros.grupo], gastosSeleccionados);
    await cargarGastosYResumen();
    return resultado;
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
        {autenticado && (
          <div className="app-header-acciones">
            <button
              type="button"
              className="config-toggle"
              onClick={() => setMostrarImportarPdf((v) => !v)}
            >
              {mostrarImportarPdf ? 'Cerrar importación' : '📄 Importar resumen'}
            </button>
            <button type="button" className="config-toggle" onClick={() => setMostrarConfig((v) => !v)}>
              {mostrarConfig ? 'Cerrar configuración' : '⚙️ Configuración'}
            </button>
          </div>
        )}
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

      {autenticado && mostrarImportarPdf && (
        <ImportarPdf
          personasDisponibles={personasDisponibles}
          onExtraer={manejarExtraerPdf}
          onConfirmar={manejarConfirmarImportacion}
          onCerrar={() => setMostrarImportarPdf(false)}
        />
      )}

      {autenticado && mostrarConfig && (
        <ConfiguracionFamilia
          config={config}
          onGuardar={manejarGuardarConfig}
          onCerrar={() => setMostrarConfig(false)}
        />
      )}

      {autenticado && error && <p className="error">{error}</p>}
      {autenticado && cargando && <p className="cargando">Cargando...</p>}

      {autenticado && !cargando && !error && resumen && (
        <>
          <Alertas resumen={resumen} config={config} />
          <div className="grid">
            <ResumenMes totalMes={resumen.totalMes} totalMesAnterior={resumen.totalMesAnterior} />
            <GraficoCategorias porCategoria={resumen.porCategoria} />
            <EvolucionMensual evolucionMensual={resumen.evolucionMensual} />
            <ComparacionPersonas porPersona={resumen.porPersona} />
            <TablaGastos gastos={gastos} onEliminar={manejarEliminarGasto} />
          </div>
        </>
      )}
    </div>
  );
}
