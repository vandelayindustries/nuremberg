/**
 * Finds the user with the lowest score.
 * @param {Object} - meta
 * @param {Object} - users
 * @return {Meta}
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

  return users[ lowest.data.user ].real_name;
}

/**
 * Finds the user with the most edits
 * @param {Map} - edits
 * @param {Object} - users
 * @return {String}
 */
function findInsecure( edits, users ) {
  let highest = -Infinity;
  let name;

  for ( const [ id, count ] of edits ) {
    if ( count > highest ) {
      name = users[ id ].real_name;
      highest = count;
    }
  }

  return name;
}

/**
 * Finds the user with the highest message count.
 * @param {Object} - meta
 * @param {Object} - users
 * @return {Meta}
 */
function findHighestCount( meta, users ) {
  let count = -Infinity;
  let highest;

  for ( const id of Object.keys( meta ) ) {
    const { msgCount } = meta[ id ].data;

    if ( msgCount > count ) {
      count = msgCount;
      highest = meta[ id ];
    }
  }

  return users[ highest.data.user ].real_name;
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
 * @param {Map} - edits The edit count of each user.
 * @return {String}
 */
function createMessage( users, messages, meta, edits ) {
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
      text: `:goldenpoop:  *Total Ass:  ${findLowestScorer( meta, users )}*`
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

  // motor mouth
  const shutup = findHighestCount( meta, users );
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:shushing_face:  *Can't Shut Up:  ${shutup}*`
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
      text: `:cold_sweat:  *Insecure:  ${findInsecure( edits, users )}*`
    }
  });

  slackMsg.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: getWorstMessages( messages, users ).join('\n')
      }
    ]
  });

  return slackMsg;
}

module.exports = createMessage;
