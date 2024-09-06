const { commands } = require('../constants');
const { validateArguments, writeString } = require('../utils');
const { CONFIG, SERVER_INFO } = require('../global');

module.exports = {
  process(connection, args) {
    validateArguments(commands.INFO, args, 0, 1);

    const [category] = args;

    const output = [`role:${SERVER_INFO.role}`];

    if (category === 'replication' && SERVER_INFO.replication) {
      Object.entries(SERVER_INFO.replication)?.forEach(([key, value]) => output.push(`${key}:${value}`));
    }

    writeString(connection, output);
  },
};
