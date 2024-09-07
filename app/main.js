const net = require('net');
const { CONFIG } = require('./global');
const { loadDatabase, expireItems } = require('./database');
const { generateRandomString, parseRespBulkString, constructArray, parseString, cleanString } = require('./utils');
const { cliParameters } = require('./constants');
const processors = require('./processors');
const { send } = require('./network');

function setServerInfo() {
  CONFIG.serverInfo.role = CONFIG[cliParameters.REPLICA_OF] ? 'slave' : 'master';

  if (CONFIG.serverInfo.role === 'master') {
    CONFIG.serverInfo.replication = { master_replid: generateRandomString(), master_repl_offset: 0 };
  }
}

function parseCliParameters() {
  const cliArguments = process.argv.slice(2);

  cliArguments.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const parameter = cliArguments[index].replace('--', '').toLowerCase();
      CONFIG[parameter] = cliArguments[index + 1];
    }
  });
}

function handleDataEvent(connection, data) {
  try {
    const [command, ...args] = parseRespBulkString(data);
    const redisCommand = command.toLowerCase();
    const processor = processors[redisCommand];

    if (processor) {
      processor.process(connection, args);
    } else {
      console.log(`Unknown command: ${redisCommand}`);
    }
  } catch (err) {
    console.log('Fatal error:', err);
  }
}

function startServer(serverHost, serverPort) {
  const server = net.createServer((connection) => {
    connection.on('data', (data) => {
      handleDataEvent(connection, data); // Send a response back to the client
    });
    connection.on('error', (err) => console.log('Connection error', err));
  });

  server.on('error', (err) => console.log('Server error', err));

  server.listen(serverPort, serverHost, () => {
    console.log(`Listening on ${server.address().address}:${server.address().port}`);
  });
}

async function pingMaster(masterHost, masterPort) {
  const response = await send(masterHost, masterPort, ['PING']);
  if (response !== 'PONG') {
    throw new Error(`Invalid handshake #1 response from master: ${response}`);
  }
}

async function sendListeningPort(masterHost, masterPort, listeningPort) {
  const response = await send(masterHost, masterPort, ['REPLCONF', 'listening-port', listeningPort]);
  if (response !== 'OK') {
    throw new Error(`Invalid handshake #2 response from master: ${response}`);
  }
}

async function sendCapability(masterHost, masterPort) {
  const response = await send(masterHost, masterPort, ['REPLCONF', 'capa', 'psync2']);
  if (response !== 'OK') {
    throw new Error(`Invalid handshake #3 response from master: ${data}`);
  }
}

async function doHandshake(serverHost, serverPort) {
  if (CONFIG.serverInfo.role === 'master') {
    return;
  }
  const [masterHost, masterPort] = CONFIG[cliParameters.REPLICA_OF].split(' ');
  await pingMaster(masterHost, masterPort);
  await sendListeningPort(masterHost, masterPort, serverPort);
  await sendCapability(masterHost, masterPort);
}

async function initialise() {
  setInterval(expireItems, 10);
  parseCliParameters();
  setServerInfo();
  loadDatabase();

  const serverHost = 'localhost';
  const serverPort = CONFIG[cliParameters.PORT] || 6379;

  startServer(serverHost, serverPort);

  await doHandshake(serverHost, serverPort);
}

initialise().catch((err) => {
  console.log('Fatal error:', err);
});
