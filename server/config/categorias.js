const CATEGORIAS = {
  Supermercado: ['supermercado', 'super', 'verduleria', 'carniceria', 'almacen', 'dia', 'coto', 'carrefour', 'jumbo', 'chino'],
  'Comida afuera': ['restaurant', 'resto', 'delivery', 'pedidosya', 'rappi', 'bar', 'cafe', 'mcdonald', 'hamburgueseria', 'pizza', 'heladeria'],
  Transporte: ['nafta', 'combustible', 'uber', 'cabify', 'taxi', 'sube', 'peaje', 'estacionamiento', 'auto', 'colectivo', 'subte', 'tren', 'bondi'],
  'Servicios/Cuentas': [
    'luz', 'gas', 'agua', 'internet', 'telefono', 'celular', 'expensas', 'alquiler', 'netflix', 'spotify', 'prepaga',
    'epec', 'ecogas', 'personal', 'claro', 'fibertel', 'cooperativa agua', 'cooperativa electricidad',
  ],
  Salud: ['farmacia', 'medico', 'medicina', 'obra social', 'dentista', 'psicologo', 'remedios'],
  Ocio: ['cine', 'teatro', 'salidas', 'boliche', 'entradas', 'juegos', 'streaming', 'recital'],
  Ropa: ['ropa', 'zapatillas', 'indumentaria', 'shopping', 'zapatos'],
  Hogar: ['hogar', 'limpieza', 'ferreteria', 'muebles', 'decoracion'],
  Mascotas: ['comida perro', 'comida gato', 'veterinaria', 'veterinario', 'piedras gato', 'piedritas', 'alimento perro', 'alimento gato'],
  Otros: [],
};

const ORDEN_CATEGORIAS = Object.keys(CATEGORIAS);

module.exports = { CATEGORIAS, ORDEN_CATEGORIAS };
