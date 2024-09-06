const commands = {
  PING: 'ping',
  ECHO: 'echo',
  SET: 'set',
  GET: 'get',
  CONFIG: 'config',
  KEYS: 'keys',
};

const parameters = {
  DIRECTORY: 'dir',
  DB_FILENAME: 'dbfilename',
  PORT: 'port',
};

const fileMarkers = {
  START_OF_DB: 0xfe,
  END_OF_DB: 0xff,
  EXPIRY_TIMEOUT_MS: 0xfc,
  EXPIRY_TIMEOUT_S: 0xfd,
};

module.exports = {
  commands,
  parameters,
  fileMarkers,
};
