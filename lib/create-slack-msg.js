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
 * Creates the slack message
 * @params {Object} stats - from lib/stats.js
 * @params {Object} users - a map of users by id
 * @params {Object} meta
 * @params {Object} lottery - info from lottery
 * @return {String}
 */
function createMessage( stats, users, meta, lottery ) {
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
      text: `:goldenpoop:  *Total Ass:  ${stats.lowest.slack.real_name}*`
    }
  });

  // sentiment whore
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:nerd_face:  *Sentiment Whore:  ${stats.highest.slack.real_name}*`
    }
  });

  // most popular
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:crown:  *Most Popular:  ${stats.popular.slack.real_name}*`
    }
  });

  // name-dropper
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:epichandshake:  *Name Dropper:  ${stats.dropper.slack.real_name}*`
    }
  });

  // Insecure
  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:cold_sweat:  *Insecure:  ${stats.insecure}*`
    }
  });

  // gamblers
  if ( stats.winners.length ) {
    const winners = stats.winners.map( w => {
      return `${w[ 0 ].slack.real_name} (${w[1]})`;
    }).join(', ');

    slackMsg.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:game_die:  *Degenerate Gamblers: ${winners}*`
      }
    });
  }

  slackMsg.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: stats.worst.join('\n')
      }
    ]
  });

  if ( lottery.winner ) {
    const { winner: { slack }, amount } = lottery;
    slackMsg.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':tada: *Lottery Winner*: ' + slack.real_name + ' won ' + amount
        }
      }
    );
  }

  // Lost wagers
  if ( stats.losers.length ) {
    slackMsg.push(
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Struck-out Losers and Their Wagers*'
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: stats.losers.map( l => {
              return `*${l[ 0 ].slack.real_name}*: ${l[ 1 ]}`;
            }).join('\n')
          }
        ]
      }
    );
  }

  return slackMsg;
}

module.exports = createMessage;
