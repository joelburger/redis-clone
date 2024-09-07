const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { CONFIG } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.PSYNC, args, 2);
    const replicaId = CONFIG.serverInfo.replication['master_replid'];
    const offset = CONFIG.serverInfo.replication['master_repl_offset'];
    writeString(connection, `FULLRESYNC ${replicaId} ${offset}`);
  },
};
