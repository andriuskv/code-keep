const express = require("express");
const session = require("express-session");
const path = require("path");
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo")(session);
const app = express();

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost/code-keep", {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false
}).then(() => {
  console.log("Connected to database");
}).catch(e => {
  console.log(e);
});

app.disable("x-powered-by");
app.use(express.json());
app.use(session({
  name: "sid",
  secret: process.env.SESSION_SECRET || "secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 1000 * 60 * 60 * 24 * 365
  },
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    collection: "session"
  })
}));

app.use("/users", require("./routes/users"));
app.use("/snippets", require("./routes/snippets"));

app.use(express.static(path.join(__dirname, "build")));
app.use("/profile_images", express.static(path.join(__dirname, "profile_images")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(process.env.PORT || 9000, () => {
  console.log(`Server running on port ${process.env.PORT || 9000}`);
});
