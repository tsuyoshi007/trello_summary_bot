require("dotenv").config();
const SLACK_TOKEN = process.env.SLACK_TOKEN;

const { WebClient } = require("@slack/web-api");
const token = SLACK_TOKEN;
const web = new WebClient(token);

/**
 * This function will send a message to slack
 * @param {String} msg
 * @param {String} channelId
 */
const sendMessage = (channelId, users) => {
  const title = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Trello Daily Report*"
    }
  };

  const block = [title];
  for (let user of users) {
    let cardUrl = "";
    for (let url of user.cardUrl) {
      cardUrl += `    ${url}\n`;
    }

    block.push(
      { type: "divider" },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*user: ${user.username}*`
        }
      },
      {
        type: "context",
        elements: [
          {
            type: "image",
            image_url:
              "https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png",
            alt_text: "notifications warning icon"
          },
          {
            type: "mrkdwn",
            text: `Card:\n${cardUrl}`
          }
        ]
      },
      {
        type: "context",
        elements: [
          {
            type: "image",
            image_url: "www.iconfinder.com/icons/1055090/download/png/64",
            alt_text: "Working Time"
          },
          {
            type: "plain_text",
            emoji: true,
            text: `Working Time : ${user.workingTime / 1000 / 60} mn`
          }
        ]
      }
    );
  }

  web.chat.postMessage({
    blocks: block,
    channel: channelId
  });
};

module.exports = {
  sendMessage: sendMessage
};
