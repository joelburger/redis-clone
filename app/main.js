const net = require('net');

// refer to https://nodejs.org/docs/latest-v20.x/api/net.html

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    connection.write('+PONG\r\n'); // Send a response back to the client
  });
  connection.on('error', (err) => {
    console.log('Connection error', err);
  });
});

server.on('error', (err) => {
  console.log('Server error', err);
});

server.listen(6379, '127.0.0.1', () => {
  console.log(`Listening on ${server.address().address}:${server.address().port}`);
});
