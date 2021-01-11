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
      name = users[ id ].real_name;
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

  return users[ highest.data.user ].real_name;
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

  return users[ highest.data.user ].real_name;
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

  return users[ highest.data.user ].real_name;
}

/**
 * Returns names of the users that correctly guessed who would have the lowest
 * sentiment score.
 *
 * @param {Object} - users
 * @param {Array} - bets
 * @param {String} - lowest
 * @returns <String> names of users
 */
function correctBets( users, bets, lowest ) {
  return bets
    .filter( b => b.target === lowest )
    .map( b => users[ b.bettor ].real_name )
    .join(', ');
}

/**
 * Return a list of all the things each losing bet wagered.
 * 
 * @param {Object} - users
 * @param {Array} - bets
 * @param {String} - lowest
 * @returns <Array<String>>
 */
function lostWagers( users, bets, lowest ) {
  return bets
    .filter( b => b.target !== lowest )
    .map( b => `*${users[ b.bettor ].real_name}*: ${b.wager}`);
}

/**
 * Creates the scores table
 * @param {Object} - meta
 * @param {Object} - users
 * @return {Array}
 */
function createScores( meta, users ) {
  const blocks = [];

  for ( const id of Object.keys( meta ) ) {
    const { real_name: name, profile } = users[ id ];
    const { sentiment, msgCount } = meta[ id ].data;

    blocks.push({
      'type': 'context',
      'elements': [
        {
          'type': 'image',
          'image_url': profile.image_32,
          'alt_text': name
        },
        {
          'type': 'plain_text',
          'text': name,
          'emoji': true
        },
        {
          'type': 'plain_text',
          'text': '-',
          'emoji': true
        },
        {
          'type': 'plain_text',
          'text': `${String( ~~sentiment )}`,
          'emoji': true
        },
        {
          'type': 'plain_text',
          'text': '-',
          'emoji': true
        },
        {
          'type': 'plain_text',
          'text': `${String( msgCount )}`,
          'emoji': true
        }
      ]
    });
  }

  return blocks;
}

/**
 * The worst messages
 * @param {Array} - messages
 * @param {Object} - users
 * @returns {Array}
 */
function getWorstMessages( messages, users ){
  const num = 5;

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
 * @param {Map} - edits The edit count of each user.
 * @param {Array} - bets for worst sentiment score
 * @return {String}
 */
function createMessage( users, messages, meta, edits, bets ) {
  const lowest = findLowestScorer( meta, users );
  const slackMsg = [];
  let ghImgBase = 'https://raw.githubusercontent.com/despreston/nuremberg/';
  ghImgBase += 'master/assets/';
  let img;

  // heaader image
  slackMsg.push({
    type: 'image',
    image_url: ghImgBase + 'sentiment-hiscore.png',
    alt_text: 'Sentiment Hi-Scores'
  });

  // header text for Name, Score, Count
  slackMsg.push({
    type: 'image',
    image_url: ghImgBase + 'name-score-count.png',
    alt_text: 'Name, score, count'
  });

  // Scores and counts
  slackMsg.push( ...createScores( meta, users ) );

  // Achievements image
  slackMsg.push({
    type: 'image',
    image_url: ghImgBase + 'achievements.png',
    alt_text: 'Achievements'
  });

  // most toxic
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:goldenpoop:  *Total Ass:  ${lowest.real_name}*`
    }
  });

  // sentiment whore
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:nerd_face:  *Sentiment Whore:  ${findHighestScore( meta, users )}*`
    }
  });

  // most popular
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:crown:  *Most Popular:  ${findMostPopular( meta, users )}*`
    }
  });

  // name-dropper
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:epichandshake:  *Name Dropper:  ${findNameDropper( meta, users )}*`
    }
  });

  // Insecure
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:cold_sweat:  *Insecure:  ${findInsecure( edits, users, meta )}*`
    }
  });

  // gamblers
  const winners = correctBets( users, bets, lowest.name );
  if ( winners ) {
    slackMsg.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:game_die:  *Gambled (and won!): ${winners}*`
      }
    });
  }

  slackMsg.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: getWorstMessages( messages, users ).join('\n')
      }
    ]
  });

  // Lost wagers
  const lost = lostWagers( users, bets, lowest.name );
  if ( lost.length ) {
    slackMsg.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Lost Wagers*'
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: lost.join('\n')
          }
        ]
      }
    );
  }

  return slackMsg;
}

module.exports = createMessage;
