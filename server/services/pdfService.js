const pdfParse = require('pdf-parse');

async function extraerTextoPdf(buffer) {
  const resultado = await pdfParse(buffer);
  return resultado.text || '';
}

module.exports = { extraerTextoPdf };
