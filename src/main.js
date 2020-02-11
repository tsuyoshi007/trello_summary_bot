require("dotenv").config();
const PORT = process.env.PORT;
const CronJob = require("cron").CronJob;

let SLACK_CHANNEL = process.env.DEFAULT_SLACK_CHANNEL;
let CRON_TIME = process.env.DEFAULT_CRON_TIME;
let cronJob;

// express
const express = require("express");
const app = express();
app.use(express.json());

// @slack/web-api
const { sendMessage, report } = require("./view/slackWeb");
const User = require("./model/User");

(async () => {
  await User.initializeDB();

  app.post("/trello", async function(req, res) {
    const actiontype = req.body.action.display.translationKey;
    if (actiontype !== "action_move_card_from_list_to_list") {
      return;
    }

    const actionId = req.body.action.id;
    const actionDate = new Date(1000 * parseInt(actionId.substring(0, 8), 16));
    if (new Date() - actionDate > 5000) {
      return;
    }

    const listAfter = req.body.action.display.entities.listAfter.id;
    const listBefore = req.body.action.display.entities.listBefore.id;

    const card = req.body.action.data.card;

    if (listAfter === "5e1ed4e595c7f20af82e1ff7") {
      User.startWorking(card, actionDate);
    } else if (listBefore === "5e1ed4e595c7f20af82e1ff7") {
      User.stopWorking(card, actionDate);
    }
  });

  app.post("/slack", function(req, res) {
    const eventType = req.body.event.type;

    if (eventType !== "message") {
      return;
    }

    const text = req.body.event.text;

    const eventTs = req.body.event.event_ts;
    const eventDate = new Date(1000 * parseInt(eventTs));
    if (new Date() - eventDate > 3000) {
      return;
    }

    const CRON_COMMAND_REGEX = /^!trello_daily_summary cron (\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?[1-5]?[0-9])) (\*|((\*\/)?(1?[0-9]|2[0-3]))) (\*|((\*\/)?([1-9]|[12][0-9]|3[0-1]))) (\*|((\*\/)?([1-9]|1[0-2]))) (\*|((\*\/)?[0-6]))$/;
    const CHANNEL_COMMAND_REGEX = /^!trello_daily_summary ch \w{1,50}$/;

    if (text.match(CRON_COMMAND_REGEX)) {
      CRON_TIME = text.replace(/!trello_daily_summary cron /, "");
      updateCronJob();
      sendMessage(SLACK_CHANNEL, "Cron Time Changed");
    } else if (text.match(CHANNEL_COMMAND_REGEX)) {
      SLACK_CHANNEL = text.replace(/!trello_daily_summary ch /, "");
      sendMessage(SLACK_CHANNEL, "Slack Channel Changed");
    }
  });
  /**
   * this function will update crontime
   */
  const updateCronJob = () => {
    if (cronJob) {
      cronJob.stop();
    }
    cronJob = new CronJob(
      CRON_TIME,
      async function() {
        const users = await User.getAllTrelloUserInDB();
        report(SLACK_CHANNEL, users);
      },
      null,
      true
    );
    cronJob.start();
  };

  app.listen(PORT);
})();
