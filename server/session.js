const session = require("express-session");
const MongoStore = require("connect-mongo");

let store = null;

function initSession(client) {
  store = MongoStore.create({
    clientPromise: client,
    collectionName: "session"
  });

  return store;
}

function getSession() {
  return session({
    name: "sid",
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    cookie: {
      sameSite: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 180
    },
    store
  });
}

function getStore() {
  return store;
}

module.exports = {
  initSession,
  getSession,
  getStore
};
