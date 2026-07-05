const { crearCliente, extraerTexto } = require('./claudeService');
const { env } = require('../config/env');

const MODELO_PREGUNTAS = 'claude-haiku-4-5-20251001';
const TIMEOUT_MS = 15000;
const MESES_DE_HISTORIA = 3;

function obtenerMesDeFecha(fecha) {
  return (fecha || '').slice(0, 7);
}

function mesesRecientes(mesActual, cantidad) {
  const [anio, mes] = mesActual.split('-').map(Number);
  const meses = [];
  for (let i = 0; i < cantidad; i += 1) {
    const fecha = new Date(anio, mes - 1 - i, 1);
    meses.push(`${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`);
  }
  return meses;
}

function calcularResumenPorMes(gastos, meses) {
  return meses.map((mes) => {
    const gastosDelMes = gastos.filter((g) => obtenerMesDeFecha(g.fecha) === mes);
    const totalMes = gastosDelMes.reduce((sum, g) => sum + g.monto, 0);

    const porCategoria = {};
    const porPersona = {};
    gastosDelMes.forEach((g) => {
      porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.monto;
      porPersona[g.persona] = (porPersona[g.persona] || 0) + g.monto;
    });

    return { mes, totalMes, porCategoria, porPersona, cantidadGastos: gastosDelMes.length };
  });
}

async function responderPregunta({ pregunta, gastos, config, persona, mesActual }) {
  if (!env.anthropicApiKey) {
    return 'Esta función todavía no está disponible.';
  }

  const meses = mesesRecientes(mesActual, MESES_DE_HISTORIA);
  const mesesValidos = new Set(meses);
  const gastosRecientes = gastos
    .filter((g) => mesesValidos.has(obtenerMesDeFecha(g.fecha)))
    .map((g) => ({
      fecha: g.fecha,
      persona: g.persona,
      categoria: g.categoria,
      descripcion: g.descripcion,
      monto: g.monto,
    }));

  const resumenPorMes = calcularResumenPorMes(gastos, meses);

  const contexto = {
    mesActual,
    ingresoMensual: config?.ingresoMensual ?? null,
    metaAhorroMensual: config?.metaAhorro ?? null,
    limitesPorCategoria: config?.limites ?? {},
    resumenPorMes,
    gastosUltimosMeses: gastosRecientes,
  };

  try {
    const cliente = crearCliente();
    const respuesta = await cliente.messages.create(
      {
        model: MODELO_PREGUNTAS,
        max_tokens: 300,
        system:
          'Sos un asistente que responde preguntas sobre los gastos de una familia argentina, por WhatsApp. ' +
          'Te paso datos en JSON y la pregunta de la persona. ' +
          'IMPORTANTE: para totales, sumas por categoria o por persona, usa EXCLUSIVAMENTE los numeros ya calculados en "resumenPorMes" ' +
          '(totalMes, porCategoria, porPersona) — no sumes vos mismo los montos de "gastosUltimosMeses", son solo para responder ' +
          'sobre transacciones puntuales (ej. el ultimo gasto, gastos de una fecha o persona especifica, o listar gastos individuales). ' +
          'Respondé en espanol rioplatense, en texto plano (sin markdown, sin tablas), corto y directo (maximo 4-5 lineas), ' +
          'usando $ para los montos. Si no tenes datos suficientes para responder con precision, decilo claramente. ' +
          `Los montos estan en pesos argentinos (ARS). Datos disponibles: ${JSON.stringify(contexto)}`,
        messages: [{ role: 'user', content: `${persona} pregunta: ${pregunta}` }],
      },
      { timeout: TIMEOUT_MS }
    );

    return extraerTexto(respuesta).trim() || 'No pude generar una respuesta, intentá reformular la pregunta.';
  } catch (err) {
    console.error('Error al responder pregunta con IA:', err.message);
    return 'No pude responder tu pregunta ahora, intentá de nuevo en un rato.';
  }
}

module.exports = { responderPregunta };
