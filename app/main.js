const net = require('net');
const { commands } = require('./constants');
const ping = require('./commands/ping');
const echo = require('./commands/echo');
const get = require('./commands/get');
const set = require('./commands/set');
const config = require('./commands/config');
const { CONFIG, STORAGE } = require('./global');

// References:
// https://nodejs.org/docs/latest-v20.x/api/net.html
// https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings

const commandProcessors = {};

setInterval(expireItems, 1);
readConfig();
registerCommandProcessors();

function registerCommandProcessors() {
  commandProcessors[commands.PING] = ping;
  commandProcessors[commands.ECHO] = echo;
  commandProcessors[commands.GET] = get;
  commandProcessors[commands.SET] = set;
  commandProcessors[commands.CONFIG] = config;
}

function readConfig() {
  const cliArguments = process.argv.slice(2);

  cliArguments.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const key = cliArguments[index].replace('--', '').toLowerCase();
      CONFIG[key] = cliArguments[index + 1];
    }
  });
}

function expireItems() {
  for (const key of Object.keys(STORAGE)) {
    const item = STORAGE[key];

    if (item.expireAt) {
      if (new Date() > item.expireAt) {
        console.log(`Expiring ${key}`);
        delete STORAGE[key];
      }
    }
  }
}

function parseRespBulkString(data) {
  return Buffer.from(data)
    .toString('UTF-8')
    .split('\r\n')
    .filter((component) => {
      return component && !component.startsWith('*') && !component.startsWith('$');
    });
}

function handleDataEvent(connection, data) {
  const parsedData = parseRespBulkString(data);
  const [command, ...args] = parsedData;

  const redisCommand = command.toLowerCase();

  if (commandProcessors.hasOwnProperty(redisCommand)) {
    commandProcessors[redisCommand].process(connection, args);
  } else {
    console.log(`Unknown command: ${redisCommand}`);
  }
}

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    handleDataEvent(connection, data); // Send a response back to the client
  });
  connection.on('error', (err) => console.log('Connection error', err));
});

server.on('error', (err) => console.log('Server error', err));

server.listen(6379, '127.0.0.1', () => {
  console.log(`Listening on ${server.address().address}:${server.address().port}`);
});
