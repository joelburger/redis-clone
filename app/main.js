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

setInterval(expireItems, 1);
readConfig();

const commandProcessors = {
  [commands.PING]: ping,
  [commands.ECHO]: echo,
  [commands.GET]: get,
  [commands.SET]: set,
  [commands.CONFIG]: config,
};

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
  const [command, ...args] = parseRespBulkString(data);
  const redisCommand = command.toLowerCase();
  const processor = commandProcessors[redisCommand];

  if (processor) {
    processor.process(connection, args);
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
