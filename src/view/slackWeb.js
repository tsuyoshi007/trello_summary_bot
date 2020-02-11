require("dotenv").config();

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const { WebClient } = require("@slack/web-api");
const web = new WebClient(SLACK_TOKEN);

/**
 * this function will send message to slack (use this when you want to send text)
 * @param {String} channelId
 * @param {String} msg
 */
const sendMessage = (channelId, msg) => {
  web.chat.postMessage({
    text: msg,
    channel: channelId
  });
};

/**
 * This function will create a block message and send to slack (Username,Card Url,Working Time will be reported)
 * @param {String} msg
 * @param {String} channelId
 */
const report = (channelId, users) => {
  const title = {
    type: "section",
    text: {
      type: "mrkdwn",
      text: "*Trello Daily Report*"
    }
  };

  const block = [title];
  for (const user of users) {
    if (user.cardUrl.length === 0) {
      continue;
    }
    let cardUrl = "";
    for (const url of user.cardUrl) {
      cardUrl += `    https://trello.com/c/${url}\n`;
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
              "https://raw.githubusercontent.com/tsuyoshi007/trello_summary_bot/master/src/icon/card.png",
            alt_text: "Card"
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
            image_url:
              "https://raw.githubusercontent.com/tsuyoshi007/trello_summary_bot/master/src/icon/clockicon.png",
            alt_text: "Working Time"
          },
          {
            type: "plain_text",
            emoji: true,
            text: `Working Time : ${(user.workingTime / 1000 / 60).toFixed(
              2
            )} mn`
          }
        ]
      }
    );
  }
  if (block.length === 1) {
    block.push({
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "No one working today !!!"
        }
      ]
    });
  }
  web.chat.postMessage({
    blocks: block,
    channel: channelId
  });
};

module.exports = {
  report: report,
  sendMessage: sendMessage
};
