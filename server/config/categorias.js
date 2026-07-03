const CATEGORIAS = {
  Supermercado: ['supermercado', 'super', 'verduleria', 'carniceria', 'almacen', 'dia', 'coto', 'carrefour', 'jumbo', 'chino'],
  'Comida afuera': ['restaurant', 'resto', 'delivery', 'pedidosya', 'rappi', 'bar', 'cafe', 'mcdonald', 'hamburgueseria', 'pizza', 'heladeria'],
  Transporte: ['nafta', 'combustible', 'uber', 'cabify', 'taxi', 'sube', 'peaje', 'estacionamiento', 'auto', 'colectivo', 'subte', 'tren'],
  'Servicios/Cuentas': ['luz', 'gas', 'agua', 'internet', 'telefono', 'celular', 'expensas', 'alquiler', 'netflix', 'spotify', 'prepaga'],
  Salud: ['farmacia', 'medico', 'medicina', 'obra social', 'dentista', 'psicologo', 'remedios'],
  Ocio: ['cine', 'teatro', 'salidas', 'boliche', 'entradas', 'juegos', 'streaming', 'recital'],
  Ropa: ['ropa', 'zapatillas', 'indumentaria', 'shopping', 'zapatos'],
  Hogar: ['hogar', 'limpieza', 'ferreteria', 'muebles', 'decoracion'],
  Otros: [],
};

const ORDEN_CATEGORIAS = Object.keys(CATEGORIAS);

module.exports = { CATEGORIAS, ORDEN_CATEGORIAS };
