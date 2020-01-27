const { MongoClient } = require('mongodb');
const conf = require('../config');

let db;
let client;

/**
 * Connects to the database, sets db and client.
 */
async function connect() {
  try {
    if ( db ) return;

    const opts = { useUnifiedTopology: true, useNewUrlParser: true };

    client = await MongoClient.connect( conf.db.conn, opts );

    db = client.db( conf.db.name );
  } catch ( err ) {
    console.error( 'Error connecting to db', err );
    throw err;
  }
}

/**
 * Closes the database client connection.
 */
function close() {
  return client.close();
}

module.exports = {
  get db() { return db; },
  connect,
  close
};

