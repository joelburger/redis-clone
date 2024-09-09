const commands = {
  PING: 'ping',
  ECHO: 'echo',
  SET: 'set',
  GET: 'get',
  CONFIG: 'config',
  KEYS: 'keys',
  INFO: 'info',
  REPLICA_CONFIG: 'replconf',
  PSYNC: 'psync',
  WAIT: 'wait',
};

const cliParameters = {
  DIRECTORY: 'dir',
  DB_FILENAME: 'dbfilename',
  PORT: 'port',
  REPLICA_OF: 'replicaof',
};

const fileMarkers = {
  START_OF_DB: 0xfe,
  END_OF_DB: 0xff,
  EXPIRY_TIMEOUT_MS: 0xfc,
  EXPIRY_TIMEOUT_S: 0xfd,
};

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 6379;
const EXPIRE_INTERVAL = 10;

module.exports = {
  commands,
  cliParameters: cliParameters,
  fileMarkers,
  DEFAULT_HOST,
  DEFAULT_PORT,
  EXPIRE_INTERVAL,
};
