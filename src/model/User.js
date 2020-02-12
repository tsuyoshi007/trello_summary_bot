const db = require("./lib/async-nedb");

const TRELLO_API_KEY = process.env.TRELLO_API_KEY;
const TRELLO_TOKEN = process.env.TRELLO_TOKEN;
const TRELLO_BOARD_ID = process.env.TRELLO_BOARD_ID;
const TRELLO_DOING_LIST = process.env.TRELLO_DOING_LIST;
const Trello = require("./lib/trello");
const trello = new Trello(TRELLO_API_KEY, TRELLO_TOKEN);

/**
 * this function will initialize db with all member in trello board and card in doing list
 */
async function initializeDB() {
  await clearDB();
  const trelloData = await getAllTrelloData();
  const users = trelloData.users;
  const doingListId = trelloData.doingListId;
  return Promise.resolve({
    users: await db.insert(users),
    doingListId: doingListId
  });
}

/**
 * this function will get all member in trello board and doing list
 */
async function getAllTrelloData() {
  const boardMember = await trello.getBoardMembers(TRELLO_BOARD_ID);
  const lists = await trello.getListsOnBoard(TRELLO_BOARD_ID);
  const doingList = lists.filter(list => {
    return list.name === TRELLO_DOING_LIST;
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
  return Promise.resolve({ users: users, doingListId: doingList.id });
}

/**
 * this function will get all document in db
 */
function getAllTrelloUserInDB() {
  return getUser();
}

/**
 *
 * @param {Object} card
 * @param {Number} timestamp
 */
async function startWorking(card, timestamp) {
  const members = await trello.getMemberInCard(card.id);
  for (const member of members) {
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

/**
 *
 * @param {Object} card
 * @param {Object} timestamp
 */
async function stopWorking(card, timestamp) {
  const members = await trello.getMemberInCard(card.id);
  for (const member of members) {
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

/**
 *
 * @param {String} userId
 */
async function getUser(userId) {
  if (userId === undefined) return db.find({});
  return db.findOne({ userId: userId });
}

/**
 * this function will clear all document in db
 */
async function clearDB() {
  return db.remove({}, { multi: true });
}

module.exports = {
  startWorking: startWorking,
  stopWorking: stopWorking,
  clearDB: clearDB,
  initializeDB: initializeDB,
  getAllTrelloUserInDB: getAllTrelloUserInDB
};
