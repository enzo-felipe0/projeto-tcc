const express = require('express');
const cors = require('cors');
const mainRoutes = require('./src/routes/mainRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/main', mainRoutes);

app.get('/', (req, res) => {
  res.send('API está funcionando!');
});

module.exports = app;