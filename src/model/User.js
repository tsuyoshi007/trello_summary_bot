const db = require("./lib/async-nedb");

const Trello = require("trello");
const trello = new Trello(
  "511464d8cb06ea21b4187dfbb67c8645",
  "227dab961b5149ee1c7914bcbbf0fd2c871cfac096f75c3c70a75d00a57366f5"
);
const trelloDoingList = "doing";

async function initializeDB() {
  await clearDB();
  const users = await getAllTrelloUser();
  return Promise.resolve(await db.insert(users));
}

async function getAllTrelloUser() {
  const boardMember = await trello.getBoardMembers("5cfb64c3db32c86781e20c7c");
  const lists = await trello.getListsOnBoard("5cfb64c3db32c86781e20c7c");
  const doingList = lists.filter(list => {
    return list.name === trelloDoingList;
  })[0];

  const users = await Promise.all(
    boardMember.map(async member => {
      const memberCards = await trello.getMemberCards(member.id);
      const cardInDoingList = memberCards.filter(card => {
        return card.idList === doingList.id;
      });
      return {
        userId: member.id,
        username: member.username,
        timestamp: cardInDoingList.length ? new Date() : 0,
        workingTime: 0,
        card: cardInDoingList.length,
        cardUrl: cardInDoingList.map(card => {
          return card.shortUrl;
        })
      };
    })
  );
  return Promise.resolve(users);
}

function getAllTrelloUserInDB() {
  return getUser();
}

async function startWorking(card, timestamp) {
  const members = await trello.getMemberInCard(card.id);
  for (let member of members) {
    const memberInDB = await getUser(member.id);
    if (memberInDB.card === 0) {
      db.update(
        { userId: member.id },
        {
          $set: {
            timestamp: timestamp,
            card: 1
          },
          $push: {
            cardUrl: card.shortLink
          }
        }
      );
    } else {
      db.update(
        { userId: member.id },
        {
          $inc: {
            card: 1
          },
          $addToSet: {
            cardUrl: card.shortLink
          }
        }
      );
    }
  }
}

async function stopWorking(card, timestamp) {
  const members = await trello.getMemberInCard(card.id);
  for (let member of members) {
    const memberInDB = await getUser(member.id);
    if (memberInDB.card === 1) {
      db.update(
        { userId: member.id },
        {
          $set: {
            timestamp: 0,
            card: 0,
            workingTime:
              memberInDB.workingTime + (timestamp - memberInDB.timestamp)
          }
        }
      );
    } else {
      db.update(
        { userId: member.id },
        {
          $inc: {
            card: -1
          }
        }
      );
    }
  }
}

async function getUser(userId) {
  if (userId === undefined) return db.find({});
  return db.findOne({ userId: userId });
}

async function clearDB() {
  db.remove({}, { multi: true }, function(err) {
    if (err) {
      console.log(err);
    }
  });
}

module.exports = {
  startWorking: startWorking,
  stopWorking: stopWorking,
  getAllTrelloUser: getAllTrelloUser,
  clearDB: clearDB,
  initializeDB: initializeDB,
  getAllTrelloUserInDB: getAllTrelloUserInDB
};
