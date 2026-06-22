const db = require('../config/db');

const salvarDados = (req, res) => {
  const { 
    motor, 
    tempo, 
    resultados, 
    so, 
    navegador, 
    ram, 
    cpu_cores, 
    gpu,
    tempo_load_modelo,
    tempo_setup_backend,
    tempo_warmup,
    memoria_antes,
    memoria_depois,
    memoria_diferenca
  } = req.body;

  //validação simples
  if (!motor || tempo === undefined || !resultados) {
    return res.status(400).json({ error: 'Dados incompletos para salvamento.' });
  }

  const query = `
    INSERT INTO benchmarks 
      (
        motor, tempo, resultados, so, navegador, ram, cpu_cores, gpu,
        tempo_load_modelo, tempo_setup_backend, tempo_warmup,
        memoria_antes, memoria_depois, memoria_diferenca
      ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const resultadosString = typeof resultados === 'string' ? resultados : JSON.stringify(resultados);

  db.run(query, [
    motor, 
    tempo, 
    resultadosString, 
    so || null, 
    navegador || null, 
    ram || null, 
    cpu_cores || null, 
    gpu || null,
    tempo_load_modelo !== undefined ? tempo_load_modelo : null,
    tempo_setup_backend !== undefined ? tempo_setup_backend : null,
    tempo_warmup !== undefined ? tempo_warmup : null,
    memoria_antes !== undefined ? memoria_antes : null,
    memoria_depois !== undefined ? memoria_depois : null,
    memoria_diferenca !== undefined ? memoria_diferenca : null
  ], function (err) {
    if (err) {
      console.error('Erro ao inserir dados no SQLite:', err.message);
      return res.status(500).json({ error: 'Erro interno ao salvar dados.' });
    }

    return res.status(201).json({
      success: true,
      message: 'Dados de inferência salvos com sucesso!',
      id: this.lastID
    });
  });
};

const listarDados = (req, res) => {
  const query = `SELECT * FROM benchmarks ORDER BY criado_em DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar dados no SQLite:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar dados.' });
    }

    const dadosFormatados = rows.map(row => ({
      ...row,
      resultados: JSON.parse(row.resultados)
    }));

    return res.json(dadosFormatados);
  });
};

//funções auxiliares de estatística
function calcularPercentil(arr, p) {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.ceil(idx);
  if (lower === upper) return parseFloat(sorted[lower].toFixed(2));
  const frac = idx - lower;
  return parseFloat((sorted[lower] * (1 - frac) + sorted[upper] * frac).toFixed(2));
}

function calcularDesvio(arr, media) {
  if (arr.length < 2) return 0;
  const variancia = arr.reduce((acc, val) => acc + Math.pow(val - media, 2), 0) / (arr.length - 1);
  return parseFloat(Math.sqrt(variancia).toFixed(2));
}

// GET /main/estatisticas
const getEstatisticas = (req, res) => {
  const queryGeral = `
    SELECT
      motor,
      COUNT(*) as count,
      AVG(tempo) as media_tempo,
      AVG(tempo_warmup) as media_warmup,
      AVG(tempo_setup_backend) as media_setup_backend,
      AVG(tempo_load_modelo) as media_load_modelo,
      AVG(memoria_diferenca) as media_memoria_diferenca,
      MIN(tempo) as min_tempo,
      MAX(tempo) as max_tempo
    FROM benchmarks
    GROUP BY motor
    ORDER BY motor
  `;

  const queryPorNavegador = `
    SELECT navegador, COUNT(*) as count
    FROM benchmarks
    WHERE navegador IS NOT NULL
    GROUP BY navegador
    ORDER BY count DESC
  `;

  const queryPorGpu = `
    SELECT gpu, motor, AVG(tempo) as media_tempo, COUNT(*) as count
    FROM benchmarks
    WHERE gpu IS NOT NULL AND gpu != 'Desconhecido'
    GROUP BY gpu, motor
    ORDER BY count DESC
    LIMIT 20
  `;

  const queryAmostrasMotor = `
    SELECT motor, tempo
    FROM benchmarks
    ORDER BY motor, tempo
  `;

  db.all(queryGeral, [], (err, resumoPorMotor) => {
    if (err) {
      console.error('Erro ao buscar estatísticas:', err.message);
      return res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
    }

    db.all(queryAmostrasMotor, [], (err, amostras) => {
      if (err) {
        console.error('Erro ao buscar amostras:', err.message);
        return res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
      }

      // Agrupar amostras por motor para calcular percentis e desvio padrão
      const amostrasAgrupadas = {};
      amostras.forEach(row => {
        if (!amostrasAgrupadas[row.motor]) amostrasAgrupadas[row.motor] = [];
        amostrasAgrupadas[row.motor].push(row.tempo);
      });

      const estatisticasMotor = resumoPorMotor.map(row => {
        const vals = amostrasAgrupadas[row.motor] || [];
        const media = row.media_tempo || 0;
        return {
          motor: row.motor,
          count: row.count,
          media_tempo: parseFloat((media).toFixed(2)),
          desvio_padrao: calcularDesvio(vals, media),
          percentil_25: calcularPercentil(vals, 25),
          percentil_50: calcularPercentil(vals, 50),
          percentil_75: calcularPercentil(vals, 75),
          percentil_95: calcularPercentil(vals, 95),
          min_tempo: parseFloat((row.min_tempo || 0).toFixed(2)),
          max_tempo: parseFloat((row.max_tempo || 0).toFixed(2)),
          media_warmup: row.media_warmup ? parseFloat(row.media_warmup.toFixed(2)) : null,
          media_setup_backend: row.media_setup_backend ? parseFloat(row.media_setup_backend.toFixed(2)) : null,
          media_load_modelo: row.media_load_modelo ? parseFloat(row.media_load_modelo.toFixed(2)) : null,
          media_memoria_diferenca: row.media_memoria_diferenca ? parseFloat(row.media_memoria_diferenca.toFixed(2)) : null,
        };
      });

      db.all(queryPorNavegador, [], (err, porNavegador) => {
        if (err) {
          console.error('Erro ao buscar dados por navegador:', err.message);
          return res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
        }

        db.all(queryPorGpu, [], (err, porGpu) => {
          if (err) {
            console.error('Erro ao buscar dados por GPU:', err.message);
            return res.status(500).json({ error: 'Erro ao calcular estatísticas.' });
          }

          return res.json({
            por_motor: estatisticasMotor,
            por_navegador: porNavegador,
            por_gpu: porGpu,
          });
        });
      });
    });
  });
};

const exportarCSV = (req, res) => {
  const query = `SELECT * FROM benchmarks ORDER BY criado_em DESC`;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Erro ao buscar dados para CSV:', err.message);
      return res.status(500).json({ error: 'Erro ao exportar CSV.' });
    }

    const cabecalho = [
      'id', 'motor', 'tempo', 'tempo_load_modelo', 'tempo_setup_backend',
      'tempo_warmup', 'memoria_antes', 'memoria_depois', 'memoria_diferenca',
      'so', 'navegador', 'ram', 'cpu_cores', 'gpu', 'criado_em'
    ];

    // CRÍTICO: Ponto e vírgula é o padrão esperado pelo Excel no Brasil
    const separador = ';'; 

    const escaparCampo = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      // Alterado para checar o separador correto (;)
      if (str.includes(separador) || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const linhas = rows.map(row =>
      cabecalho.map(col => escaparCampo(row[col])).join(separador)
    );

    // CRÍTICO: \r\n é o padrão de quebra de linha que o Excel interpreta melhor
    const csv = [cabecalho.join(separador), ...linhas].join('\r\n');

    // Montar o nome do arquivo dinâmico aqui no backend
    const date = new Date().toISOString().slice(0, 10);
    const filename = `benchmarks_${date}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // O BOM (\uFEFF) garante que acentuações não quebrem
    return res.send('\uFEFF' + csv); 
  });
};

module.exports = {
  salvarDados,
  listarDados,
  getEstatisticas,
  exportarCSV
};