const { commands } = require('./constants');
const ping = require('./commands/ping');
const echo = require('./commands/echo');
const get = require('./commands/get');
const set = require('./commands/set');
const config = require('./commands/config');
const keys = require('./commands/keys');
const info = require('./commands/info');
const replconf = require('./commands/replconf');
const psync = require('./commands/psync');
const { parseArrayBulkString } = require('./utils');

const processors = {
  [commands.PING]: ping,
  [commands.ECHO]: echo,
  [commands.GET]: get,
  [commands.SET]: set,
  [commands.CONFIG]: config,
  [commands.KEYS]: keys,
  [commands.INFO]: info,
  [commands.REPLICA_CONFIG]: replconf,
  [commands.PSYNC]: psync,
};

function handleDataEvent(socket, data) {
  try {
    const stringData = data.toString('utf-8');
    const commandGroups = parseArrayBulkString(stringData);
    commandGroups.forEach((commandGroup) => {
      console.log(`Incoming command: ${commandGroup}`);
      const [command, ...args] = commandGroup;
      const redisCommand = command.toLowerCase();
      const processor = processors[redisCommand];

      if (processor) {
        processor.process(socket, args);
      } else {
        console.log(`Unknown command: ${redisCommand}`);
      }
    });
  } catch (err) {
    console.log('Fatal error:', err);
  }
}

module.exports = {
  handleDataEvent,
};
