const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { CONFIG } = require('../global');
const { readDatabaseFile } = require('../database');

function syncFile(connection) {
  const base64 =
    'UkVESVMwMDEx+glyZWRpcy12ZXIFNy4yLjD6CnJlZGlzLWJpdHPAQPoFY3RpbWXCbQi8ZfoIdXNlZC1tZW3CsMQQAPoIYW9mLWJhc2XAAP/wbjv+wP9aog==';
  const rdbBuffer = Buffer.from(base64, 'base64');
  const rdbHead = Buffer.from(`$${rdbBuffer.length}\r\n`);
  connection.write(Buffer.concat([rdbHead, rdbBuffer]));
}

module.exports = {
  process(connection, args) {
    validateArguments(commands.PSYNC, args, 2);
    const replicaId = CONFIG.serverInfo.replication['master_replid'];
    const offset = CONFIG.serverInfo.replication['master_repl_offset'];
    writeString(connection, `FULLRESYNC ${replicaId} ${offset}`);
    syncFile(connection);
  },
};
