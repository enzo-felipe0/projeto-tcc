const express = require('express');
const router = express.Router();
const benchmarkController = require('../controllers/benchmarkController');

//salvar as métricas coletadas
router.post('/dados', benchmarkController.salvarDados);

//listar os dados acumulados
router.get('/dados', benchmarkController.listarDados);

module.exports = router;