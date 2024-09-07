const net = require('net');
const { parseString, cleanString, writeArray, constructArray } = require('./utils');

async function send(host, port, stringValues) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();

    client.connect(port, host, () => {
      console.log(`Connected to ${host}:${port}`);
      const payload = constructArray(stringValues);
      client.write(Buffer.from(payload));
    });

    client.on('data', (buffer) => {
      console.log(`Received: ${buffer}`);
      client.destroy(); // Close the connection after receiving the response
      const { stringValue } = parseString(buffer);
      resolve(cleanString(stringValue));
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
