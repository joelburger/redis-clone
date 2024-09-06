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
    return [null, 0];
  }

  // first character indicates the length of the key
  const stringLength = binaryData[cursor];

  // increment cursor to the start of the string value
  cursor++;

  // retrieve the string value
  const value = binaryData.slice(cursor, cursor + stringLength)?.toString('ascii');

  return [value, stringLength];
}

function readDatabaseFile() {
  const filePath = `${CONFIG[parameters.DIRECTORY]}/${CONFIG[parameters.DB_FILENAME]}`;
  const doesDBFileExist = fs.existsSync(filePath);

  if (doesDBFileExist) {
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
  const databaseKeys = database.slice(4);

  console.log('databaseKeys', databaseKeys);

  let cursor = 0;
  while (cursor < databaseKeys.length) {
    // TODO handle different encoding types
    const encodingType = databaseKeys[cursor];

    // move the cursor to the start of the key
    cursor++;

    const [key, keyLength] = parseString(databaseKeys, cursor);
    cursor += keyLength;

    // move the cursor to the start of the  value
    cursor++;

    const [value, valueLength] = parseString(databaseKeys, cursor);
    cursor += valueLength;

    // move the cursor to either the next item or the expiry marker
    cursor++;

    // TODO Handle expiry
    if (databaseKeys[cursor] === fileMarkers.EXPIRY_TIMEOUT_MS) {
      // skip expiry marker
      cursor++;

      // skip expiry value in ms (8 bytes)
      cursor += 8;
    } else if (databaseKeys[cursor] === fileMarkers.EXPIRY_TIMEOUT_S) {
      // skip expiry marker
      cursor++;

      // skip the expiry value in s (4 bytes)
      cursor += 4;
    }

    console.log(`about to insert: ${key} - ${value}`);

    STORAGE.set(key, { name: key, value });
  }
}

module.exports = {
  loadDatabase,
};
