const express = require("express");
const Snippet = require("../models/Snippet");
const User = require("../models/User");
const router = express.Router();

router.get("/:userId", async (req, res) => {
  try {
    const snippets = await Snippet.find({ userId: req.params.userId });

    if (Array.isArray(snippets)) {
      res.json({
        snippets: snippets.map(snippet => ({
          id: snippet.id,
          created: snippet.created,
          title: snippet.title,
          description: snippet.description,
          files: snippet.files,
          settings: snippet.settings
        }))
      });
    }
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
});

router.post("/create", async (req, res) => {
  if (!req.session.user) {
    return res.json({ code: 401 });
  }
  try {
    const snippet = await Snippet.findOneAndUpdate({ id: req.body.id }, req.body);

    if (snippet) {
      res.json({ code: 200 });
    }
    else {
      const snippet = new Snippet({ ...req.body, userId: req.session.user._id });
      await snippet.save();

      res.json({ code: 200 });
    }
  } catch (e) {
    console.log(e);
    return res.json({ code: 500 });
  }
});

router.post("/delete", async (req, res) => {
  if (!req.session.user) {
    return res.json({ code: 401 });
  }
  try {
    const snippet = await Snippet.findOneAndRemove({ id: req.body.id });

    if (snippet) {
      res.json({ code: 200 });
    }
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
});

router.post("/:snippetId/:status?", async (req, res) => {
  let userId = null;

  if (req.params.status === "edit") {
    if (req.session.user) {
      userId = req.session.user._id;
    }
    else {
      return res.json({ code: 401 });
    }
  }
  else {
    try {
      const user = await User.findById(req.body.id);

      if (user) {
        userId = user._id;
      }
      else {
        return res.json({ code: 404, message: "User not found." });
      }
    } catch (e) {
      console.log(e);
      return res.json({ code: 500 });
    }
  }
  sendSnippet(res, req.params.snippetId, userId);
});

async function sendSnippet(res, snippetId, userId) {
  try {
    const snippet = await Snippet.findOne({ $and: [{ id: snippetId }, { userId }]});

    if (snippet) {
      res.send(snippet);
    }
    else {
      res.json({ code: 404, message: "Snippet not found." });
    }
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
}

module.exports = router;
