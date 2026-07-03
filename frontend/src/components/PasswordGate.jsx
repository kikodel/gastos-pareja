import { useState } from 'react';

export default function PasswordGate({ grupoNombre, error, cargando, onSubmit }) {
  const [valor, setValor] = useState('');

  function manejarSubmit(e) {
    e.preventDefault();
    if (!valor || cargando) return;
    onSubmit(valor);
  }

  return (
    <div className="password-gate">
      <form className="password-gate-card" onSubmit={manejarSubmit}>
        <h2>Esta familia tiene sus gastos protegidos</h2>
        <p>Ingresá la contraseña de "{grupoNombre}" para ver sus gastos.</p>
        <input
          type="password"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          placeholder="Contraseña"
          autoFocus
        />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={cargando}>
          {cargando ? 'Verificando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}
