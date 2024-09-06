const fs = require('fs');
const { fileMarkers, cliParameters } = require('./constants');
const { CONFIG, STORAGE } = require('./global');

// First 4 bytes from DB file are ignored
// e.g.
// 00                       /* The index of the database (size encoded).
// FB                       // Indicates that hash table size information follows.
// 02                       /* The size of the hash table that stores the keys and values (size encoded).
// 01                       /* The size of the hash table that stores the expires of the keys (size encoded).
const DB_FILE_START_OFFSET = 4;

function sliceData(binaryData, startCharacter, endCharacter) {
  const startPosition = binaryData.findIndex((byte) => byte === startCharacter);
  const endPosition = binaryData.findIndex((byte) => byte === endCharacter);

  if (startPosition > -1 && endPosition > startPosition) {
    return binaryData.slice(startPosition + 1, endPosition);
  }
  return binaryData;
}

function parseNumber(binaryData, cursor, numberOfBytes) {
  let unixTime = 0;
  for (let i = 0; i < numberOfBytes; i++) {
    unixTime += binaryData[cursor + i] * Math.pow(256, i);
  }

  return unixTime;
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
  const stringValue = binaryData.slice(cursor, cursor + stringLength)?.toString('ascii');

  // increment cursor with length of string
  cursor += stringLength;

  return { stringValue, cursor };
}

function readDatabaseFile() {
  if (!CONFIG[cliParameters.DIRECTORY] || !CONFIG[cliParameters.DB_FILENAME]) {
    return null;
  }

  const filePath = `${CONFIG[cliParameters.DIRECTORY]}/${CONFIG[cliParameters.DB_FILENAME]}`;
  const doesFileExist = fs.existsSync(filePath);

  if (doesFileExist) {
    return fs.readFileSync(filePath);
  } else {
    console.error(`Database file ${filePath} does not exist`);
    return null;
  }
}

function parseItemExpiry(items, cursor) {
  let expireAt;
  if (items[cursor] === fileMarkers.EXPIRY_TIMEOUT_MS) {
    // read expiry marker
    cursor++;

    expireAt = new Date(parseNumber(items, cursor, 8));

    // move cursor to the equivalent length of the expiry value in ms (8 bytes)
    cursor += 8;
  } else if (items[cursor] === fileMarkers.EXPIRY_TIMEOUT_S) {
    // read the expiry marker
    cursor++;

    expireAt = new Date(parseNumber(items, cursor, 4));

    // move cursor to the equivalent length of the expiry value in s (4 bytes)
    cursor += 4;
  }

  return { expireAt, cursor };
}

function loadDatabase() {
  const binaryData = readDatabaseFile();

  if (!binaryData) {
    return;
  }

  const database = sliceData(binaryData, fileMarkers.START_OF_DB, fileMarkers.END_OF_DB);

  const items = database.slice(DB_FILE_START_OFFSET);

  let cursor = 0;
  while (cursor < items.length) {
    const { expireAt, cursor: updatedCursorFromExpiry } = parseItemExpiry(items, cursor);
    cursor = updatedCursorFromExpiry;

    // TODO handle different encoding types
    // read the encoding type
    const encodingType = items[cursor];
    cursor++;

    const { stringValue: key, cursor: updatedCursorFromKey } = parseString(items, cursor);
    cursor = updatedCursorFromKey;

    const { stringValue: value, cursor: updatedCursorFromValue } = parseString(items, cursor);
    cursor = updatedCursorFromValue;

    STORAGE.set(key, { name: key, value, expireAt });
  }
}

function expireItems() {
  for (const item of STORAGE.values()) {
    if (item.expireAt) {
      if (new Date() > item.expireAt) {
        console.log(`Expiring ${item.name}`);
        STORAGE.delete(item.name);
      }
    }
  }
}

module.exports = {
  loadDatabase,
  expireItems,
};
