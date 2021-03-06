const config = {
  dev: {
    slackResultsChannel: process.env.slack_results_channel,
    slackToken: process.env.slack_token,
    saveMeta: process.env.SAVE_META || false,
    resetBets: false,
    db: {
      conn: `mongodb+srv://${ process.env.db_username }:${ process.env.db_password }@cluster0-ltj7y.mongodb.net/test?retryWrites=true&w=majority`,
      name: 'vandelay-industries'
    }
  },
  prod: {
    slackResultsChannel: process.env.slack_results_channel,
    slackToken: process.env.slack_token,
    saveMeta: true,
    resetBets: true,
    db: {
      conn: `mongodb+srv://${ process.env.db_username }:${ process.env.db_password }@cluster0-ltj7y.mongodb.net/test?retryWrites=true&w=majority`,
      name: 'vandelay-industries'
    }
  }
};

module.exports = config[ process.env.NODE_ENV || 'dev' ];
