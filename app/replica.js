const { CONFIG } = require('./global');
const { cliParameters } = require('./constants');
const { isMaster } = require('./helpers/common');
const { createSocket, sendMessage } = require('./helpers/network');
const { constructBulkStringArray, removeTerminators } = require('./helpers/resp');

function validateResponse(response, expectedResponse) {
  const cleanedResponse = removeTerminators(response);

  console.log(`Validating response: ${cleanedResponse}`);

  if (!new RegExp(`^${expectedResponse}$`).test(cleanedResponse)) {
    throw new Error(`Unexpected response: received "${cleanedResponse}", but expected "${expectedResponse}".`);
  }
}

async function ping(socket) {
  const response = await sendMessage(socket, constructBulkStringArray(['PING']));
  validateResponse(response, 'PONG');
}

async function sendListeningPort(socket, listeningPort) {
  const response = await sendMessage(socket, constructBulkStringArray(['REPLCONF', 'listening-port', listeningPort]));
  validateResponse(response, 'OK');
}

async function sendCapability(socket) {
  const response = await sendMessage(socket, constructBulkStringArray(['REPLCONF', 'capa', 'psync2']));
  validateResponse(response, 'OK');
}

async function sendPSync(socket) {
  const response = await sendMessage(socket, constructBulkStringArray(['PSYNC', '?', '-1']));
  validateResponse(response, 'FULLRESYNC.+');
}

async function handshake(serverHost, serverPort, dataEventHandler) {
  if (isMaster()) return;

  const [masterHost, masterPort] = CONFIG[cliParameters.REPLICA_OF].split(' ');
  const socket = createSocket(masterPort, masterHost, dataEventHandler);
  socket.connect(masterPort, masterHost);
  await ping(socket);
  await sendListeningPort(socket, serverPort);
  await sendCapability(socket);
  await sendPSync(socket);
}

module.exports = {
  handshake,
};
