const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const { getSession } = require("./session.js");

const app = express();

mongoose.connect(process.env.DB_URI || "mongodb://localhost/code-keep", {
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

app.listen(process.env.PORT || 9000, () => {
  console.log(`Server running on port ${process.env.PORT || 9000}`);
});
