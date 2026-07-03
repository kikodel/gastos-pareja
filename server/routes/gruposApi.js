const express = require('express');
const { listarGrupos, obtenerGrupo, verificarPassword } = require('../config/grupos');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(listarGrupos());
});

router.get('/:id/verificar', (req, res) => {
  const { id } = req.params;
  const { password } = req.query;

  const grupo = obtenerGrupo(id);
  if (!grupo) {
    res.status(404).json({ ok: false, error: 'Grupo desconocido' });
    return;
  }

  res.json({ ok: verificarPassword(id, password || '') });
});

module.exports = router;
