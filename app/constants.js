const commands = {
  CONFIG: 'config',
  DISCARD: 'discard',
  ECHO: 'echo',
  EXEC: 'exec',
  GET: 'get',
  INCR: 'incr',
  INFO: 'info',
  KEYS: 'keys',
  MULTI: 'multi',
  PING: 'ping',
  PSYNC: 'psync',
  REPLCONF: 'replconf',
  SET: 'set',
  TYPE: 'type',
  WAIT: 'wait',
  XADD: 'xadd',
  XRANGE: 'xrange',
  XREAD: 'xread',
};

const cliParameters = {
  DIRECTORY: 'dir',
  DB_FILENAME: 'dbfilename',
  HOST: 'host',
  PORT: 'port',
  REPLICA_OF: 'replicaof',
};

const fileMarkers = {
  START_OF_DB: 0xfe,
  END_OF_DB: 0xff,
  EXPIRY_TIMEOUT_MS: 0xfc,
  EXPIRY_TIMEOUT_S: 0xfd,
};

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 6379;
const EXPIRE_INTERVAL = 10;

module.exports = {
  commands,
  cliParameters,
  fileMarkers,
  DEFAULT_HOST,
  DEFAULT_PORT,
  EXPIRE_INTERVAL,
};
