const http = require('http');
const app = require('./app');

http.createServer(app).listen(3335, '0.0.0.0', () => {
  console.log('Servidor HTTP rodando na porta 3335');
});
