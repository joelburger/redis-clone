const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { CONFIG, REPLICAS } = require('../global');
const { constructSimpleString, EMPTY_RDB_FILE, constructFile } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.PSYNC, args, 2);
    const replicaId = CONFIG.serverInfo.replication['master_replid'];
    const offset = CONFIG.serverInfo.replication['master_repl_offset'];
    socket.write(constructSimpleString(`FULLRESYNC ${replicaId} ${offset}`));
    socket.write(constructFile(EMPTY_RDB_FILE));
    REPLICAS.push(socket);
  },
};
