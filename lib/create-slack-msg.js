/**
 * Finds the user with the lowest score.
 * @param {Object} - meta
 * @return {Meta}
 */
function findLowestScorer( meta ) {
  let score = Infinity;
  let lowest;

  for ( const id of Object.keys( meta ) ) {
    const { sentiment } = meta[ id ].data;

    if ( sentiment < score ) {
      score = sentiment;
      lowest = meta[ id ];
    }
  }

  return lowest;
}

/**
 * Creates the header of the message with the total message count
 * @param {Object} - messages
 * @return {String}
 */
function createHeader( messages ) {
  const count = messages.length;
  return `*Sentiment - last 7 days (${ count } messages )* :hammer_time:`;
}

/**
 * Creates the scores table
 * @param {Object} - meta
 * @param {Object} - users
 * @return {String}
 */
function createScores( meta, users ) {
  let scores = '```                                                \n';
  scores += 'Sentiment: \n\n';

  for ( const userId of Object.keys( meta ) ) {
    const { real_name: name } = users[ userId ];
    const { sentiment }       = meta[ userId ].data;

    // Add user's sentiment to message
    scores += `${ ( name + ':' ).padEnd( 20, ' ' ) }`;
    scores += ` ${ sentiment.toFixed( 6 ) }\n`;
  }

  return scores + '```';
}

/**
 * Creates message count table
 * @param {Object} - users
 * @param {Object} - meta
 * @return {String}
 */
function createMessageCounts( users, meta ) {
  let str = '```                                                  \n';
  str += 'Message Counts: \n\n';

  for ( const userId of Object.keys( meta ) ) {
    const { real_name: name } = users[ userId ];
    const { msgCount }        = meta[ userId ].data;

    // Add user's sentiment to message
    str += `${ ( name + ':' ).padEnd( 20, ' ' ) } ${ msgCount }\n`;
  }

  return str + '```';
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
    .map( message => {
      return `"${ message.text }" -${ users[ message.user ].real_name }`;
    });
}

/**
 * Creates the slack message
 * @param {Object} - users
 * @param {Array} - messages
 * @param {Object} - meta
 * @return {String}
 */
function createMessage( users, messages, meta ) {
  const slackMsg = [];

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: createHeader( messages )
    }
  });

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: createScores( meta, users )
    }
  });

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: createMessageCounts( users, meta )
    }
  });

  const lowestScorer = findLowestScorer( meta );
  const lowestName = users[ lowestScorer.data.user ].real_name;

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:biohazard_sign: *${ lowestName } toxic again this week.*`
    }
  });

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':dumpsterfire: Some highlights from the dumpster fire:'
    }
  });

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '```' + getWorstMessages( messages, users ).join('\n') + '```'
    }
  });

  return slackMsg;
}

module.exports = createMessage;
