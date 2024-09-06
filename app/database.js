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

  return { stringValue, stringLength };
}

function readDatabaseFile() {
  if (!CONFIG[parameters.DIRECTORY] || !CONFIG[parameters.DB_FILENAME]) {
    return null;
  }

  const filePath = `${CONFIG[parameters.DIRECTORY]}/${CONFIG[parameters.DB_FILENAME]}`;
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

  // Skip database metadata
  // e.g.
  // 00                       /* The index of the database (size encoded).
  // FB                       // Indicates that hash table size information follows.
  // 02                       /* The size of the hash table that stores the keys and values (size encoded).
  // 01                       /* The size of the hash table that stores the expires of the keys (size encoded).
  const items = database.slice(4);

  let cursor = 0;
  while (cursor < items.length) {
    const { expireAt, cursor: newCursor } = parseItemExpiry(items, cursor);
    cursor = newCursor;

    // TODO handle different encoding types
    const encodingType = items[cursor];

    // read the encoding type
    cursor++;

    const { stringValue: key, stringLength: keyLength } = parseString(items, cursor);
    cursor += keyLength;

    // move the cursor to the start of the  value
    cursor++;

    const { stringValue: value, stringLength: valueLength } = parseString(items, cursor);
    cursor += valueLength;

    // move the cursor to the next item
    cursor++;

    STORAGE.set(key, { name: key, value, expireAt });
  }
}

module.exports = {
  loadDatabase,
};
