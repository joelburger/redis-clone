# Redis Clone

## Overview

This project is a simplified clone of the Redis in-memory data structure store. It supports basic Redis commands and
functionalities.

## Features

- Basic Redis commands: `GET`, `SET`, `INCR`, `DECR`, `DEL`, etc.
- Stream commands: `XADD`, `XRANGE`, `XREAD`
- Transaction support: `MULTI`, `EXEC`, `DISCARD`
- Replication support

## Installation

Install dependencies:

```sh
npm install
```

## Usage

1. Start the server:
    ```sh
    npm run dev
    ```

2. Connect to the server using a Redis client (e.g. redis-cli):
    ```sh
    redis-cli -h 127.0.0.1 -p 6379
    ```

## Configuration

You can configure the server using command-line parameters:

- `--port`: Specify the port to run the server on (default: 6379)
- `--replicaof`: Specify the master server for replication

Example:

```sh
npm start -- --port 6380 --replicaof 127.0.0.1 6379