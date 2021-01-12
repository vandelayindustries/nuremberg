const db         = require('./db');
const conf       = require('../config');
const slack      = require('./slack');
const User       = require('./classes/user');
const Meta       = require('./classes/meta');
const createMsg  = require('./create-slack-msg');
const getOneWeek = require('./utils/one-week');
const genStats   = require('./stats');
const GuacEvent  = require('./classes/guac-event');

// matches all mentions in a message. 
// E.g. "<@UDX7DNWN6>" would capture "UDX7DNWN6" 
const mentionRe = /<@([A-Z1-9]+)>/g;

/**
 * Fetches messages from the database for the last seven days.
 *
 * @returns {Promise} - array of messages
 * @throws
 */
function fetchMessages() {
  return db.db.collection('messages')
    .find({ updated: { $gt: getOneWeek() } })
    .sort({ updated: -1 })
    .toArray();
}

/**
 * Fetches all the edits for the last week and maps users to edit count.
 *
 * @returns {Map} - key: user id, val: edit count for week
 * @throws
 */
async function fetchEdits() {
  const edits = await db.db.collection('edits').aggregate([
    {
      $match: {
        created: {
          $gt: getOneWeek()
        }
      },
    },
    { $group: { _id: '$user', count: { $sum: 1 } } }
  ]).toArray();

  return edits.reduce( ( map, row ) => map.set( row._id, row.count ), new Map );
}

function fetchBets() {
  return db.db.collection('bets').find().toArray();
}

function deleteAllBets() {
  return db.db.collection('bets').deleteMany({});
}

/**
 * Fetches users using the messages provided.
 *
 * @param {Object} messages
 * @returns {Object} - a map of users by id
 * @throws
 */
async function fetchSlackProfiles( messages ) {
  const profiles = {};

  for ( const { user: id } of messages ) {
    if ( !profiles[ id ] ) {
      const details = await slack.users.info({
        user: id,
        include_locale: false
      });

      profiles[ id ] = details.user;
    }
  }

  return profiles;
}

/**
 * Returns all user docs for the given slack IDs. This returns an object of
 * slack id's mapped to the user document.
 *
 * @param {Array<String>} ids - slack ids
 * @returns {Promise<Object>} slack ids mapped to the full user doc
 * @throws
 */
async function usersForSlackIDs( ids ) {
  const res = await db.db.collection('users')
    .find({ 'slack.id': { $in: ids } })
    .toArray();
  return res.reduce( ( obj, user ) => ({ ...obj, [ user.slack.id ]: user }), {} );
}

/**
 * Updates the slack profile for each user. Creates a new user if one doesn't
 * exist.
 *
 * @param {Object} profiles - the slack profiles map'd by slack id
 * @returns {Object} slack id mapped to full user document
 * @throws
 */
async function saveSlackProfiles( profiles ) {
  const slackIDs = Object.keys( profiles );
  const allPrev = await usersForSlackIDs( slackIDs );
  const ops = [];

  for ( const p of Object.values( profiles ) ) {
    const prev = allPrev[ p.id ] || {};

    // create a new user to validate the slack profile data
    const u = new User({ ...prev, slack: p });
    
    // update or create a new one doc if one doesn't exist for this slack id,
    // then add the result (the full User doc) to the users object.
    ops.push({
      updateOne: {
        filter: { 'slack.id': p.id },
        update: { $set: u.data }
      }
    });
  }

  // Perform all operations in bulk
  await db.db.collection('users').bulkWrite( ops, { ordered: false } );

  // Perform the query again so this returns the updated docs.
  return usersForSlackIDs( slackIDs ); 
}

/**
 * Calculates the sentiment scores and message count for each user
 *
 * @param {Object} messages
 * @param {Object} users
 * @returns {Object} the message counts and sentiment score for each user
 */
function createMeta( messages, users ) {
  const userIds = Object.keys( users );

  const metaDataByUser = Object.fromEntries( userIds.map( id => {
    const metaObj = new Meta({
      user:      id,
      sentiment: 0,
      msgCount:  0,
      start:     getOneWeek(),
      end:       new Date(),
      mentions:  0,
      mentioned: 0
    });

    return [ id, metaObj ];
  }));

  for ( const { text, user, sentiment } of messages ) {
    // check for any mentions in the message
    const mentions = [ ...text.matchAll( mentionRe ) ];

    for ( const mention of mentions ) {
      const id = mention[ 1 ];

      if ( metaDataByUser[ id ] ) {
        metaDataByUser[ id ].data.mentioned++;
        metaDataByUser[ user ].data.mentions++;
      }
    }

    metaDataByUser[ user ].data.sentiment += sentiment;
    metaDataByUser[ user ].data.msgCount += 1;
  }

  for ( const metaObj of Object.values( metaDataByUser ) ) {
    metaObj.data.sentiment = metaObj.data.sentiment / metaObj.data.msgCount;
  }

  return metaDataByUser;
}

/**
 * Saves metadata into the db.
 *
 * @param {Array} - Meta instances
 * @returns {Promise}
 * @throws
 */
async function saveMeta( meta ) {
  return db.db.collection('meta').insertMany( meta.map( m => m.data ) );
}

/**
 * Returns an object that can be included in a bulkWrite. The operation updates
 * the user's guac_total.
 *
 * @param {User} user
 * @param {Number} amount - to add to the guac_total
 * @returns {Object} a bulkWrite operation
 */
function wageAdjustmentOp( user, amount ) {
  return {
    updateOne: {
      filter: {
        'slack.id': user.slack.id
      },
      update: {
        $set: {
          guac_total: user.guac_total + amount
        }
      }
    }
  };
}

function newGuacEventOp( to, from, amount ) {
  const ge = new GuacEvent({
    to,
    from,
    amount: amount,
    time: Date.now()
  });

  return { insertOne: { document: ge.data } };
}

/**
 * Updates the winners' and losers' guac_total according to what they wagered.
 * 
 * @param {Array<Array<User, wager>>} winners - tuples of user and their wage
 * @param {Array<Array<User, wager>>} losers - tuples of user and their wage
 */
async function handleWagers( winners, losers ) {
  const evtOps = [];
  const ops = [];

  // for now filter any non-numeric wages
  // TODO: update Operator to enforce only numeric wagers
  
  for ( const [ user, wager ] of winners ) {
    if ( !Number.isInteger( wager ) ) {
      continue;
    }
    ops.push( wageAdjustmentOp( user, wager ) )
    evtOps.push( newGuacEventOp( user.slack.id, 'sentiment', wager ) );
  }

  for ( const [ user, wager ] of losers ) {
    if ( !Number.isInteger( wager ) ) {
      continue;
    }
    ops.push( wageAdjustmentOp( user, wager * -1 ) )
    evtOps.push( newGuacEventOp( 'sentiment', user.slack.id, wager ) );
  }

  // nobody bet this week?
  if ( !ops.length ) {
    return
  }

  return Promise.all([
    db.db.collection('users').bulkWrite( ops, { ordered: false } ),
    db.db.collection('quac_events').bulkWrite( evtOps, { ordered: false } )
  ]);
}

/**
 * Sends message to slack channel
 *
 * @param {String} - message
 * @returns {Promise}
 * @throws
 */
function sendSlackMsg( message ) {
  return slack.chat.postMessage({
    channel: conf.slackResultsChannel,
    blocks:  JSON.stringify( message ),
    text:    ''
  });
}

async function handler( event, context ) {
  try {
    await db.connect();
    const messages = await fetchMessages();
    const profiles = await fetchSlackProfiles( messages );
    const users = await saveSlackProfiles( profiles );
    const meta = createMeta( messages, users );

    // save the metadata into the db
    if ( conf.saveMeta ) {
      console.log('saving meta data');
      await saveMeta( Object.values( meta ) );
    }

    const edits = await fetchEdits();
    const bets = await fetchBets();

    // Reset the bets collection.
    if ( conf.resetBets ) {
      console.log('resetting bets');
      await deleteAllBets();
    }

    const stats = await genStats( users, messages, meta, edits, bets );
    await handleWagers( stats.winners, stats.losers );
    const msg = createMsg( stats, profiles, meta );
    await sendSlackMsg( msg );
  } catch ( err ) {
    console.error( 'Failed with error: ', err );
  } finally {
    db.close();
  }
}

module.exports = { handler };
