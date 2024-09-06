const net = require('net');
const { CONFIG, SERVER_INFO } = require('./global');
const { loadDatabase, expireItems } = require('./database');
const { generateRandomString, parseRespBulkString } = require('./utils');
const { cliParameters } = require('./constants');
const processors = require('./processors');

function calculateServerInfo() {
  SERVER_INFO.role = CONFIG[cliParameters.REPLICA_OF] ? 'slave' : 'master';

  if (SERVER_INFO.role === 'master') {
    SERVER_INFO.replication = { master_replid: generateRandomString(), master_repl_offset: 0 };
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

function startServer() {
  const server = net.createServer((connection) => {
    connection.on('data', (data) => {
      handleDataEvent(connection, data); // Send a response back to the client
    });
    connection.on('error', (err) => console.log('Connection error', err));
  });

  const port = CONFIG[cliParameters.PORT] || 6379;

  server.on('error', (err) => console.log('Server error', err));

  server.listen(port, '127.0.0.1', () => {
    console.log(`Listening on ${server.address().address}:${server.address().port}`);
  });
}

function initialise() {
  setInterval(expireItems, 100);
  parseCliParameters();
  calculateServerInfo();
  loadDatabase();
  startServer();
}

initialise();
