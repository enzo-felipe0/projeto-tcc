const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco SQLite:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite com sucesso.');
  }
});

//criação da tabela e migrações
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS benchmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      motor TEXT NOT NULL,
      tempo REAL NOT NULL,
      resultados TEXT NOT NULL,
      criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Adiciona as novas colunas caso elas ainda não existam
  const novasColunas = [
    { nome: 'so', tipo: 'TEXT' },
    { nome: 'navegador', tipo: 'TEXT' },
    { nome: 'ram', tipo: 'TEXT' },
    { nome: 'cpu_cores', tipo: 'TEXT' },
    { nome: 'gpu', tipo: 'TEXT' },
    { nome: 'tempo_load_modelo', tipo: 'REAL' },
    { nome: 'tempo_setup_backend', tipo: 'REAL' },
    { nome: 'tempo_warmup', tipo: 'REAL' },
    { nome: 'memoria_antes', tipo: 'REAL' },
    { nome: 'memoria_depois', tipo: 'REAL' },
    { nome: 'memoria_diferenca', tipo: 'REAL' }
  ];

  novasColunas.forEach(col => {
    db.run(`ALTER TABLE benchmarks ADD COLUMN ${col.nome} ${col.tipo}`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error(`Erro ao adicionar coluna ${col.nome}:`, err.message);
      }
    });
  });
});

module.exports = db;