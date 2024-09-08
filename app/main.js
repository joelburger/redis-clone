const net = require('net');
const { CONFIG } = require('./global');
const { loadDatabase, expireItems } = require('./database');
const { generateRandomString, parseRespBulkString } = require('./utils');
const { cliParameters } = require('./constants');
const processors = require('./processors');
const { connectToMaster, isReplica } = require('./replica');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 6379;
const EXPIRE_INTERVAL = 10;

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

function handleDataEvent(socket, data) {
  try {
    const [command, ...args] = parseRespBulkString(data);
    const redisCommand = command.toLowerCase();
    const processor = processors[redisCommand];

    if (processor) {
      processor.process(socket, args);
    } else {
      console.log(`Unknown command: ${redisCommand}`);
    }
  } catch (err) {
    console.log('Fatal error:', err);
  }
}

function startServer() {
  const serverHost = DEFAULT_HOST;
  const serverPort = CONFIG[cliParameters.PORT] || DEFAULT_PORT;

  const server = net.createServer((socket) => {
    socket.on('data', (data) => handleDataEvent(socket, data));
    socket.on('error', (err) => console.log('Socket error', err));
  });

  server.on('error', (err) => console.log('Server error', err));

  server.listen(serverPort, serverHost, () => {
    console.log(`Listening on ${server.address().address}:${server.address().port}`);
  });
}

async function initialise() {
  setInterval(expireItems, EXPIRE_INTERVAL);
  parseCliParameters();
  setServerInfo();
  loadDatabase();
  startServer();

  // TODO Fix this
  const serverHost = DEFAULT_HOST;
  const serverPort = CONFIG[cliParameters.PORT] || DEFAULT_PORT;
  if (isReplica()) {
    connectToMaster(serverHost, serverPort).then((r) => console.log('Connection established with master'));
  }
}

initialise().catch((err) => {
  console.log('Fatal error:', err);
});
