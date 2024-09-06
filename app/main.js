const net = require('net');
const { commands, parameters } = require('./constants');
const ping = require('./commands/ping');
const echo = require('./commands/echo');
const get = require('./commands/get');
const set = require('./commands/set');
const keys = require('./commands/keys');
const config = require('./commands/config');
const info = require('./commands/info');
const { CONFIG, STORAGE } = require('./global');
const { loadDatabase } = require('./database');

// References:
// https://nodejs.org/docs/latest-v20.x/api/net.html
// https://redis.io/docs/latest/develop/reference/protocol-spec/#bulk-strings

setInterval(expireItems, 1);
readConfig();
loadDatabase();

const commandProcessors = {
  [commands.PING]: ping,
  [commands.ECHO]: echo,
  [commands.GET]: get,
  [commands.SET]: set,
  [commands.CONFIG]: config,
  [commands.KEYS]: keys,
  [commands.INFO]: info,
};

function readConfig() {
  const cliArguments = process.argv.slice(2);

  cliArguments.forEach((arg, index) => {
    if (arg.startsWith('--')) {
      const parameter = cliArguments[index].replace('--', '').toLowerCase();
      CONFIG[parameter] = cliArguments[index + 1];
    }
  });
}

function expireItems() {
  for (const item of STORAGE.values()) {
    if (item.expireAt) {
      if (new Date() > item.expireAt) {
        console.log(`Expiring ${item.name}`);
        STORAGE.delete(item.name);
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
  try {
    const [command, ...args] = parseRespBulkString(data);
    const redisCommand = command.toLowerCase();
    const processor = commandProcessors[redisCommand];

    if (processor) {
      processor.process(connection, args);
    } else {
      console.log(`Unknown command: ${redisCommand}`);
    }
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}

const server = net.createServer((connection) => {
  connection.on('data', (data) => {
    handleDataEvent(connection, data); // Send a response back to the client
  });
  connection.on('error', (err) => console.log('Connection error', err));
});

server.on('error', (err) => console.log('Server error', err));

const port = CONFIG[parameters.PORT] || 6379;

server.listen(port, '127.0.0.1', () => {
  console.log(`Listening on ${server.address().address}:${server.address().port}`);
});
