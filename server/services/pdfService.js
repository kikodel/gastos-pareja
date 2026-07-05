const { PDFParse } = require('pdf-parse');

async function extraerTextoPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const resultado = await parser.getText();
    return resultado.text || '';
  } finally {
    await parser.destroy();
  }
}

module.exports = { extraerTextoPdf };
