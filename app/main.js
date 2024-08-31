const net = require('net');

const server = net.createServer((connection) => {
  connection.addListener('data', (data) => {
    console.log('Received ', data.toString());
    connection.write('+PONG\r\n');
  });
});

server.listen(6379, '127.0.0.1');

console.log('Listening on port 6379...');
