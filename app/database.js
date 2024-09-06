const { fileMarkers, parameters } = require('./constants');
const { CONFIG, STORAGE } = require('./global');
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

function readDatabaseFile() {
  const filePath = `${CONFIG[parameters.DIRECTORY]}/${CONFIG[parameters.DB_FILENAME]}`;
  const isDbExists = fs.existsSync(filePath);

  if (isDbExists) {
    return fs.readFileSync(filePath);
  } else {
    console.error(`Database file ${filePath} does not exist`);
    return null;
  }
}

function loadDatabase() {
  const binaryData = readDatabaseFile();

  if (!binaryData) {
    return;
  }

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
  while (cursor < databaseKeys.length) {
    const [key, newCursor1] = parseString(databaseKeys, cursor);
    cursor = newCursor1;
    const [value, newCursor2] = parseString(databaseKeys, cursor);
    cursor = newCursor2;

    // TODO Handle expiry

    STORAGE.set(key, { name: key, value });
  }
}

module.exports = {
  loadDatabase,
};
