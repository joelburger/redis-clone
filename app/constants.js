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
};

const fileMarkers = {
  START_OF_DB: 'fe',
  END_OF_DB: 'ff',
};

module.exports = {
  commands,
  parameters,
  fileMarkers,
};
