const fs = require('fs');
const { fileMarkers, cliParameters } = require('../constants');
const { CONFIG, STORAGE } = require('../global');
const { readUnixTime, sliceData, readString } = require('./buffer');

// First 4 bytes from DB file are ignored
// e.g.
// 00                       /* The index of the database (size encoded).
// FB                       // Indicates that hash table size information follows.
// 02                       /* The size of the hash table that stores the keys and values (size encoded).
// 01                       /* The size of the hash table that stores the expires of the keys (size encoded).
const DB_FILE_START_OFFSET = 4;

function constructFilePathFromConfig() {
  if (!CONFIG[cliParameters.DIRECTORY] || !CONFIG[cliParameters.DB_FILENAME]) {
    return null;
  }

  return `${CONFIG[cliParameters.DIRECTORY]}/${CONFIG[cliParameters.DB_FILENAME]}`;
}

function readDatabaseFile(filePath = constructFilePathFromConfig()) {
  if (!filePath) {
    return null;
  }

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

    expireAt = new Date(readUnixTime(items, cursor, 8));

    // move cursor to the equivalent length of the expiry value in ms (8 bytes)
    cursor += 8;
  } else if (items[cursor] === fileMarkers.EXPIRY_TIMEOUT_S) {
    // read the expiry marker
    cursor++;

    expireAt = new Date(readUnixTime(items, cursor, 4));

    // move cursor to the equivalent length of the expiry value in s (4 bytes)
    cursor += 4;
  }

  return { expireAt, cursor };
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

function loadDatabase() {
  const buffer = readDatabaseFile();

  if (!buffer) {
    return;
  }

  const database = sliceData(buffer, fileMarkers.START_OF_DB, fileMarkers.END_OF_DB);

  const items = database.slice(DB_FILE_START_OFFSET);

  let cursor = 0;
  while (cursor < items.length) {
    const { expireAt, cursor: updatedCursorFromExpiry } = parseItemExpiry(items, cursor);
    cursor = updatedCursorFromExpiry;

    // TODO handle different encoding types
    // read the encoding type
    const encodingType = items[cursor];
    cursor++;

    const { stringValue: key, cursor: updatedCursorFromKey } = readString(items, cursor);
    cursor = updatedCursorFromKey;

    const { stringValue: value, cursor: updatedCursorFromValue } = readString(items, cursor);
    cursor = updatedCursorFromValue;

    STORAGE.set(key, { name: key, value, expireAt });
  }
}

module.exports = {
  loadDatabase,
  expireItems,
};
