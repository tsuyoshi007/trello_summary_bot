var Datastore = require("nedb");
var db = new Datastore({ filename: "./test.db", autoload: true });

/**
 * return promise of nedb findOne
 * @param {JSON} query
 */
const find = query => {
  return new Promise((resolve, reject) => {
    db.find(query, (err, doc) => {
      if (err) {
        reject(err);
      }
      resolve(doc);
    });
  });
};

/**
 * return promise of nedb findOne
 * @param {JSON} query
 */
const findOne = query => {
  return new Promise((resolve, reject) => {
    db.findOne(query, (err, doc) => {
      if (err) {
        reject(err);
      }
      resolve(doc);
    });
  });
};

/**
 * return promise of nedb insert
 * @param {JSON} query
 */
const insert = query => {
  return new Promise((resolve, reject) => {
    db.insert(query, (err, newDoc) => {
      if (err) {
        reject(err);
      }
      resolve(newDoc);
    });
  });
};

/**
 * return promise of nedb update
 * @param {JSON} query
 * @param {JSON} update
 */
const update = (query, update) => {
  return new Promise((resolve, reject) => {
    db.update(query, update, (err, updated) => {
      if (err) {
        reject(err);
      }
      resolve(updated);
    });
  });
};

const remove = (query, options) => {
  return new Promise((resolve, reject) => {
    db.remove(query, options, function(err, numDoc) {
      if (err) {
        reject(err);
      }
      resolve(numDoc);
    });
  });
};

module.exports = {
  findOne: findOne,
  insert: insert,
  update: update,
  remove: remove,
  find: find
};
