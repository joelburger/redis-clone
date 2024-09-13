const { commands } = require('./constants');
const config = require('./commands/config');
const discard = require('./commands/discard');
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
const type = require('./commands/type');
const wait = require('./commands/wait');
const xadd = require('./commands/xadd');
const xrange = require('./commands/xrange');
const xread = require('./commands/xread');

module.exports = {
  master: {
    [commands.CONFIG]: config,
    [commands.DISCARD]: discard,
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
    [commands.TYPE]: type,
    [commands.WAIT]: wait,
    [commands.XADD]: xadd,
    [commands.XRANGE]: xrange,
    [commands.XREAD]: xread,
  },
  replica: {
    [commands.INCR]: incr,
    [commands.PING]: ping,
    [commands.REPLCONF]: replconf,
    [commands.SET]: set,
  },
};
