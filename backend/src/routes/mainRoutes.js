const express = require('express');
const router = express.Router();
const benchmarkController = require('../controllers/benchmarkController');

//salvar as métricas coletadas
router.post('/dados', benchmarkController.salvarDados);

//listar os dados acumulados
router.get('/dados', benchmarkController.listarDados);

//obter estatísticas agregadas por motor, navegador e GPU
router.get('/estatisticas', benchmarkController.getEstatisticas);

//exportar todos os dados brutos em formato CSV
router.get('/exportar-csv', benchmarkController.exportarCSV);

module.exports = router;