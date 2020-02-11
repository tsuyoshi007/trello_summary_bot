var Datastore = require("nedb");
var db = new Datastore({ filename: "./src/model/test.db", autoload: true });

/**
 * return promise of nedb findOne
 * @param {Object} query
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
 * @param {Object} query
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
 * @param {Object} query
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
 * @param {Object} query
 * @param {Object} update
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

/**
 *
 * @param {Object} query
 * @param {Object} options
 */
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
