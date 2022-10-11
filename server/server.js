const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const { initSession, getSession } = require("./session.js");

const app = express();

const client = mongoose.connect(process.env.DB_URI || "mongodb://127.0.0.1/code-keep", {
  useUnifiedTopology: true,
  useNewUrlParser: true
}).then(mongoose => {
  console.log("Connected to database");
  return mongoose.connection.getClient();
}).catch(e => {
  console.log(e);
});

initSession(client);

app.disable("x-powered-by");
app.use(cors({
  credentials: true,
  origin: ["https://code-keep.herokuapp.com"],
  allowedHeaders: ["Content-Type", "Cookie", "Set-Cookie"]
}));
app.use(express.json());

app.set("trust proxy", 1);
app.use(getSession());

app.use("/image", require("./routes/image"));
app.use("/api/users", require("./routes/users"));
app.use("/api/snippets", require("./routes/snippets"));
app.use("/api/search", require("./routes/search"));

app.use(express.static(path.join(__dirname, "build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.listen(process.env.PORT || 8080, () => {
  console.log(`Server running on port ${process.env.PORT || 8080}`);
});
