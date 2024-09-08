const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { CONFIG } = require('../global');

module.exports = {
  process(socket, args) {
    validateArguments(commands.INFO, args, 0, 1);

    const [category] = args;

    const output = [`role:${CONFIG.serverInfo.role}`];

    if (category === 'replication' && CONFIG.serverInfo.replication) {
      Object.entries(CONFIG.serverInfo.replication)?.forEach(([key, value]) => output.push(`${key}:${value}`));
    }

    writeString(socket, output);
  },
};
