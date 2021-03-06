const request = require('request-promise')
const debug = require('debug')('botkit:rasa')

module.exports = config => {
  if (!config) {
    config = {}
  }

  if (!config.rasa_uri) {
    config.rasa_uri = 'http://localhost:5000'
  }

  var middleware = {
    receive: (bot, message, next, text_to_translate) => {
      // is_echo: can be true for facebook bots when the echo webhook is subscribed
      // bot_id: keep an eye https://github.com/howdyai/botkit/pull/694
      // if bot_id is present, the message comes from another bot
      const text_to_parse = (text_to_translate) ? text_to_translate : message.text;
      if (!text_to_parse || message.is_echo || message.bot_id) {
        next()
        return
      }

      debug('Sending message to Rasa', text_to_parse)
      const options = {
        method: 'POST',
        uri: `${config.rasa_uri}/parse`,
        body: {
          q: text_to_parse,
          project: `${config.rasa_project}`
        },
        json: true
      }

      request(options)
        .then(response => {
          debug('Rasa response', response);
          message.intent = response.intent;
          message.entities = response.entities;
          message.intent_ranking = response.intent_ranking;
          next();
        })
    },

    hears: (patterns, message) => {
      return patterns.some(pattern => {
        if (pattern && message.intent && new RegExp(pattern).test(message.intent.name)) {
          debug('Rasa intent matched hear pattern', message.intent, pattern)
          return true
        }
      })
    }

  }
  return middleware
}
