const net = require('net');

async function send(host, port, message) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.connect(port, host, () => {
      console.log(`Connected to ${host}:${port}`);
      client.write(message);
    });

    client.on('data', (buffer) => {
      console.log(`Received: ${buffer}`);

      client.destroy(); // Close the connection after receiving the response

      resolve(buffer);
    });

    client.on('close', () => {
      console.log('Connection closed');
    });

    client.on('error', (err) => {
      console.error(`Connection error: ${err.message}`);
      reject(err);
    });
  });
}

module.exports = {
  send,
};
