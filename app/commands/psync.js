const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { CONFIG, REPLICAS } = require('../global');

function syncFile(socket) {
  const base64 =
    'UkVESVMwMDEx+glyZWRpcy12ZXIFNy4yLjD6CnJlZGlzLWJpdHPAQPoFY3RpbWXCbQi8ZfoIdXNlZC1tZW3CsMQQAPoIYW9mLWJhc2XAAP/wbjv+wP9aog==';
  const rdbBuffer = Buffer.from(base64, 'base64');
  const rdbHead = Buffer.from(`$${rdbBuffer.length}\r\n`);
  socket.write(Buffer.concat([rdbHead, rdbBuffer]));
}

module.exports = {
  process(socket, args) {
    validateArguments(commands.PSYNC, args, 2);
    const replicaId = CONFIG.serverInfo.replication['master_replid'];
    const offset = CONFIG.serverInfo.replication['master_repl_offset'];
    writeString(socket, `FULLRESYNC ${replicaId} ${offset}`);
    syncFile(socket);
    REPLICAS.push(socket);
  },
};
