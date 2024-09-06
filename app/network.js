const net = require('net');

function send(host, port, message) {
  const client = new net.Socket();

  client.connect(port, host, () => {
    console.log(`Connected to ${host}:${port}`);
    client.write(message);
  });

  client.on('data', (data) => {
    console.log(`Received: ${data}`);
    client.destroy(); // Close the connection after receiving the response
  });

  client.on('close', () => {
    console.log('Connection closed');
  });

  client.on('error', (err) => {
    console.error(`Connection error: ${err.message}`);
  });
}

module.exports = {
  send,
};
