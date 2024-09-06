const { commands, parameters, fileMarkers } = require('../constants');
const { validateArguments, writeString, writeArray } = require('../utils');
const { CONFIG } = require('../global');
const fs = require('fs');

function sliceData(binaryData, startCharacter, endCharacter) {
  const startPosition = binaryData.findIndex((byte) => byte === startCharacter);
  const endPosition = binaryData.findIndex((byte) => byte === endCharacter);

  if (startPosition > -1 && endPosition > startPosition) {
    return binaryData.slice(startPosition + 1, endPosition);
  }
  return binaryData;
}

function parseString(binaryData, cursor) {
  if (cursor >= binaryData.length) {
    return [null, cursor];
  }

  // first character indicates the length of the key
  const stringLength = binaryData[cursor];

  // increment cursor to the start of the string value
  cursor++;

  // retrieve the string value
  const value = binaryData.slice(cursor, cursor + stringLength)?.toString('ascii');

  // calculate new cursor position
  const newCursor = cursor + stringLength;

  return [value, newCursor];
}

function parseDatabase(binaryData) {
  const database = sliceData(binaryData, fileMarkers.START_OF_DB, fileMarkers.END_OF_DB);

  // Skip database metadata
  // e.g.
  // 00                       /* The index of the database (size encoded).
  // FB                       // Indicates that hash table size information follows.
  // 02                       /* The size of the hash table that stores the keys and values (size encoded).
  // 01                       /* The size of the hash table that stores the expires of the keys (size encoded).
  // 00                       /* The 1-byte flag that specifies the value’s type and encoding.
  const databaseKeys = database.slice(5);

  let cursor = 0;
  let map = new Map();
  while (cursor < databaseKeys.length) {
    const [key, newCursor1] = parseString(databaseKeys, cursor);
    cursor = newCursor1;
    const [value, newCursor2] = parseString(databaseKeys, cursor);
    cursor = newCursor2;

    // TODO Handle expiry

    map.set(key, value);
  }

  return map;
}

function getBinaryData() {
  const filePath = `${CONFIG[parameters.DIRECTORY]}/${CONFIG[parameters.DB_FILENAME]}`;
  return fs.readFileSync(filePath);
}

function filterKeys(map, specifiedKey) {
  if (specifiedKey) {
    return Array.from(map.keys()).filter((key) => key.toLowerCase() === specifiedKey.toLowerCase());
  }
  return Array.from(map.keys());
}

module.exports = {
  process(connection, args) {
    validateArguments(commands.KEYS, args, 0, 1);

    const binaryData = getBinaryData();
    const map = parseDatabase(binaryData);
    const [specifiedKey] = args;
    const output = filterKeys(map, specifiedKey);

    writeArray(connection, Array.from(output));
  },
};
