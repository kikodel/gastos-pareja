const express = require('express');
const { listarGrupos } = require('../config/grupos');

const router = express.Router();

router.get('/', (req, res) => {
  res.json(listarGrupos());
});

module.exports = router;
