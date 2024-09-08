const { commands } = require('../constants');
const { validateArguments } = require('../helpers/common');
const { CONFIG } = require('../global');
const { constructArray, constructSimpleString } = require('../helpers/resp');

module.exports = {
  process(socket, args) {
    validateArguments(commands.INFO, args, 0, 1);

    const [category] = args;
    const serverInfo = [`role:${CONFIG.serverInfo.role}`];

    if (category === 'replication' && CONFIG.serverInfo.replication) {
      Object.entries(CONFIG.serverInfo.replication)?.forEach(([key, value]) => serverInfo.push(`${key}:${value}`));
    }

    socket.write(constructSimpleString(serverInfo));
  },
};
