const { WebClient } = require('@slack/web-api');
const conf = require('../config');

module.exports = new WebClient( conf.slackToken );
