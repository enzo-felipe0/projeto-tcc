const db = require('../config/db');

const salvarDados = (req, res) => {
  const { motor, tempo, resultados, so, navegador, ram, cpu_cores, gpu } = req.body;

  //validação simples
  if (!motor || tempo === undefined || !resultados) {
    return res.status(400).json({ error: 'Dados incompletos para salvamento.' });
  }

  const query = `
    INSERT INTO benchmarks 
      (motor, tempo, resultados, so, navegador, ram, cpu_cores, gpu) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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
    gpu || null
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

module.exports = {
  salvarDados,
  listarDados
};