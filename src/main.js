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
const { sendMessage } = require("./view/slackWeb");
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

    const CRON_COMMAND_REGEX = /^trello_daily_summary cron .{1,2}.{1,2}.{1,2}.{1,2}.{1,2}$/;
    const CHANNEL_COMMAND_REGEX = /^trello_daily_summary ch \w{1,50}$/;

    if (text.match(CRON_COMMAND_REGEX)) {
      CRON_TIME = text.substring(29, text.length);
      updateCronJob();
    } else if (text.match(CHANNEL_COMMAND_REGEX)) {
      SLACK_CHANNEL = text.substring(27, text.length);
    }
  });

  const updateCronJob = () => {
    if (cronJob) {
      cronJob.stop();
    }
    cronJob = new CronJob(
      CRON_TIME,
      async function() {
        const users = await User.getAllTrelloUserInDB();
        sendMessage(SLACK_CHANNEL, users);
      },
      null,
      true
    );
    cronJob.start();
  };

  setTimeout(async () => {
    const users = await User.getAllTrelloUserInDB();
    sendMessage(SLACK_CHANNEL, users);
  }, 20000);

  app.listen(PORT);
})();
