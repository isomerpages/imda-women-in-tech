const request = require('request');

const { SLACK_URI, SLACK_ALERT_URI } = process.env;

function sendSlackMessage(message, alert = false) {
  let encodedMessage = message;

  const URI = (alert && SLACK_ALERT_URI) ? SLACK_ALERT_URI : SLACK_URI;
  if (!URI) throw new Error('No Slack URI was defined!');

  // Encode the 3 characters we have to use HTML encoding for: &, <, and >
  // see: https://api.slack.com/docs/message-formatting
  encodedMessage = encodedMessage.replace(/&/g, '&amp;');
  encodedMessage = encodedMessage.replace(/</g, '&lt;');
  encodedMessage = encodedMessage.replace(/>/g, '&gt;');

  const clientServerOptions = {
    uri: URI,
    body: `{"text": ${JSON.stringify(encodedMessage)}}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  request(clientServerOptions, (error) => {
    if (error) {
      // oh no the message didn't go through to Slack
      console.log(`The message didn't go through to Slack!\n${error}`);
    }
  });
}

module.exports = { sendSlackMessage };
