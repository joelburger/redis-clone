const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { CONFIG } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.PSYNC, args, 2);
    const replicaId = CONFIG.serverInfo.replication['master_replid'];
    writeString(connection, `FULLRESYNC ${replicaId} 0`);
  },
};
