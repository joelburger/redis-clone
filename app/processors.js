const { commands } = require('./constants');
const config = require('./commands/config');
const echo = require('./commands/echo');
const exec = require('./commands/exec');
const get = require('./commands/get');
const incr = require('./commands/incr');
const info = require('./commands/info');
const keys = require('./commands/keys');
const multi = require('./commands/multi');
const ping = require('./commands/ping');
const psync = require('./commands/psync');
const replconf = require('./commands/replconf');
const set = require('./commands/set');
const wait = require('./commands/wait');

module.exports = {
  master: {
    [commands.CONFIG]: config,
    [commands.ECHO]: echo,
    [commands.EXEC]: exec,
    [commands.GET]: get,
    [commands.INCR]: incr,
    [commands.INFO]: info,
    [commands.KEYS]: keys,
    [commands.MULTI]: multi,
    [commands.PING]: ping,
    [commands.PSYNC]: psync,
    [commands.REPLCONF]: replconf,
    [commands.SET]: set,
    [commands.WAIT]: wait,
  },
  replica: {
    [commands.INCR]: incr,
    [commands.PING]: ping,
    [commands.REPLCONF]: replconf,
    [commands.SET]: set,
  },
};
