// returns all the stats for the slack message and whatever else may need them

/**
 * Finds the user with the lowest score.
 * @param {Object} - meta
 * @param {Object} - users
 * @return {User}
 */
function findLowestScorer( meta, users ) {
  let score = Infinity;
  let lowest;

  for ( const id of Object.keys( meta ) ) {
    const { sentiment } = meta[ id ].data;

    if ( sentiment < score ) {
      score = sentiment;
      lowest = meta[ id ];
    }
  }

  return users[ lowest.data.user ];
}

/**
 * Finds the user with the most average edits per message
 * @param {Map} - edits
 * @param {Object} - users
 * @param {Object} - meta
 * @return {String}
 */
function findInsecure( edits, users, meta ) {
  let highest = -Infinity;
  let name;

  // Instead of finding the user with the most edits, we find the the user with
  // the most edits per message. This is the count of edits divided by the total
  // messages. The average is more accurate since some users don't post as many
  // messages.
  for ( const [ id, count ] of edits ) {
    const { msgCount } = meta[ id ].data;
    const avg = ~~( count / msgCount );

    if ( avg > highest ) {
      name = users[ id ].slack.real_name;
      highest = avg;
    }
  }

  return name;
}

/**
 * Finds the user with the most mentions.
 * @param {Object} - meta
 * @param {Object} - users
 * @return {Meta}
 */
function findMostPopular( meta, users ) {
  let count = -Infinity;
  let highest;

  for ( const id of Object.keys( meta ) ) {
    const { mentioned } = meta[ id ].data;

    if ( mentioned > count ) {
      count = mentioned;
      highest = meta[ id ];
    }
  }

  return users[ highest.data.user ];
}

/**
 * Finds the user who mentioned the most people.
 * @param {Object} - meta
 * @param {Object} - users
 * @return {Meta}
 */
function findNameDropper( meta, users ) {
  let count = -Infinity;
  let highest;

  for ( const id of Object.keys( meta ) ) {
    const { mentions } = meta[ id ].data;

    if ( mentions > count ) {
      count = mentions;
      highest = meta[ id ];
    }
  }

  return users[ highest.data.user ];
}

/**
 * Finds the user with the highest score.
 * @param {Object} - meta
 * @param {Object} - users
 * @return {Meta}
 */
function findHighestScore( meta, users ) {
  let score = -Infinity;
  let highest;

  for ( const id of Object.keys( meta ) ) {
    const { sentiment } = meta[ id ].data;

    if ( sentiment > score ) {
      score = sentiment;
      highest = meta[ id ];
    }
  }

  return users[ highest.data.user ];
}

/**
 * Returns names of the users that correctly guessed who would have the lowest
 * sentiment score.
 *
 * @param {Object} - users
 * @param {Array} - bets
 * @param {String} - lowest
 * @returns {Array<Array<User, Number>>} tuples of user and their wager
 */
function correctBets( users, bets, lowest ) {
  return bets
    .filter( b => b.target === lowest )
    .map( b => [ users[ b.bettor ], b.wager ] );
}

/**
 * Return a list of all the things each losing bet wagered.
 *
 * @param {Object} - users
 * @param {Array} - bets
 * @param {String} - lowest
 * @returns {Array<Array<User, Number>} tuples of user and their wager
 */
function losers( users, bets, lowest ) {
  return bets
    .filter( b => b.target !== lowest )
    .map( b => [ users[ b.bettor ], b.wager ] );
}

/**
 * The worst messages
 * @param {Array} - messages
 * @param {Object} - users
 * @returns {Array}
 */
function getWorstMessages( messages, users ){
  const num = 10;
  return [ ...messages ]
    .sort( ( a, b ) => a.sentiment - b.sentiment )
    .splice( 0, num )
    .map( m => `"${ m.text }" -${ users[ m.user ].slack.real_name }` );
}

module.exports = async ( users, messages, meta, edits, bets ) => {
  const lowest = findLowestScorer( meta, users );

  return {
    lowest,
    highest: findHighestScore( meta, users ), 
    popular: findMostPopular( meta, users ),
    dropper: findNameDropper( meta, users ),
    insecure: findInsecure( edits, users, meta ),
    winners: correctBets( users, bets, lowest.slack.name ),
    worst: getWorstMessages( messages, users ),
    losers: losers( users, bets, lowest.slack.name )
  };
}
