const net = require('net');
const { readString } = require('./buffer');

function createSocket(host, port, dataEventHandler) {
  const socket = new net.Socket();

  socket.on('data', (data) => dataEventHandler(socket, data));

  socket.on('close', () => {
    console.log('Connection closed');
  });

  socket.on('error', (err) => {
    console.error(`Connection error: ${err.message}`);
  });

  socket.on('connect', () => {
    console.log(`Connected to ${host}:${port}`);
  });

  return socket;
}

function createServer(host, port, dataEventHandler) {
  const server = net.createServer((socket) => {
    socket.on('data', (data) => dataEventHandler(socket, data));
    socket.on('error', (err) => console.log('Socket error', err));
  });

  server.on('listening', () => console.log(`Listening on ${server.address().address}:${server.address().port}`));
  server.on('error', (err) => console.log('Server error', err));

  return server;
}

/**
 * Sends a message to the specified socket and waits for a response.
 *
 * @param {net.Socket} socket - The socket to which the message will be sent.
 * @param {string} message - The message to be sent.
 * @returns {Promise<string>} - A promise that resolves with the string response from the socket.
 *
 * @throws {Error} - If there is an error during the socket write or in the response handling.
 */
async function sendMessage(socket, message) {
  return new Promise((resolve, reject) => {
    socket.write(message, (err) => {
      if (err) {
        return reject(err);
      }

      socket.once('data', (buffer) => {
        try {
          const { stringValue } = readString(buffer);
          resolve(stringValue);
        } catch (err) {
          console.log('Error:', err);
          reject(err);
        }
      });

      socket.once('error', (err) => {
        console.log('Error:', err);
        reject(err);
      });
    });
  });
}

module.exports = {
  createSocket,
  createServer,
  sendMessage,
};
