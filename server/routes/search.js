const express = require("express");
const router = express.Router();
const Snippet = require("../models/Snippet");
const User = require("../models/User");

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

router.get("/", async (req, res) => {
  if (!req.query.q) {
    return res.sendStatus(400);
  }
  try {
    const [snippets, users] = await Promise.all([
      Snippet.find({ title: { $regex: new RegExp(escapeRegExp(req.query.q), "i") }, type: "remote" }),
      User.find({ usernameLowerCase: { $regex: new RegExp(escapeRegExp(req.query.q), "i") } })
    ]);
    const snippetUsers = await Promise.all(snippets.map(snippet => User.findById(snippet.userId)));

    res.json({
      snippets: snippets.map((snippet, index) => {
        snippet.user = snippetUsers[index].getUser();
        return snippet;
      }),
      users: users.map(user => user.getUser())
    });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
