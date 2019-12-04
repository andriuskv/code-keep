const session = require("express-session");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);

const store = new MongoStore({
  mongooseConnection: mongoose.connection,
  collection: "session"
});

function getStore() {
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

module.exports = {
  getStore,
  getSession
};
