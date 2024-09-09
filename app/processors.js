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
const wait = require('./commands/wait');

module.exports = {
  master: {
    [commands.PING]: ping,
    [commands.ECHO]: echo,
    [commands.GET]: get,
    [commands.SET]: set,
    [commands.CONFIG]: config,
    [commands.KEYS]: keys,
    [commands.INFO]: info,
    [commands.REPLICA_CONFIG]: replconf,
    [commands.PSYNC]: psync,
    [commands.WAIT]: wait,
  },
  replica: {
    [commands.SET]: set,
    [commands.PING]: ping,
    [commands.REPLICA_CONFIG]: replconf,
  },
};
