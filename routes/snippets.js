const express = require("express");
const Snippet = require("../models/Snippet");
const User = require("../models/User");
const router = express.Router();

router.get("/:userId", async (req, res) => {
  const isPrivateValues = [false];

  if (req.session.user) {
    const getPrivate = req.session.user._id === req.params.userId;

    if (getPrivate) {
      isPrivateValues.push(getPrivate);
    }
  }

  try {
    const snippets = await Snippet.find({ $and: [{ userId: req.params.userId }, { isPrivate: {$in: isPrivateValues }}]});

    if (Array.isArray(snippets)) {
      res.json({
        snippets: snippets.map(snippet => ({
          id: snippet.id,
          userId: snippet.userId,
          created: snippet.created,
          title: snippet.title,
          description: snippet.description,
          files: snippet.files,
          settings: snippet.settings,
          isPrivate: snippet.isPrivate,
          fork: snippet.fork
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
    // If user tries to fork same snippet, ignore it.
    if (req.body.fork) {
      const snippet = await Snippet.findOne({ $and: [{ "fork.id": req.body.fork.id }, { userId: req.session.user._id }]});

      if (snippet) {
        return res.json({ code: 200, id: snippet.id });
      }
    }
    const snippet = new Snippet({ ...req.body, userId: req.session.user._id });
    await snippet.save();

    res.json({ code: 200 });
  } catch (e) {
    console.log(e);
    return res.json({ code: 500 });
  }
});

router.post("/update", async (req, res) => {
  if (!req.session.user) {
    return res.json({ code: 401 });
  }
  try {
    const snippet = await Snippet.findOneAndUpdate({ $and: [{ id: req.body.id }, { userId: req.session.user._id }]}, req.body);

    if (snippet) {
      return res.json({ code: 200 });
    }
    res.json({ code: 404 });
  } catch (e) {
    console.log(e);
    return res.json({ code: 500 });
  }
});

router.post("/delete", async (req, res) => {
  if (!req.session.user || req.session.user._id !== req.body.userId) {
    return res.json({ code: 401 });
  }
  try {
    await Snippet.findOneAndRemove({ $and: [{ id: req.body.snippetId }, { userId: req.body.userId }]});
    res.json({ code: 200 });
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
});

router.post("/:snippetId/:status?", async (req, res) => {
  let userId = null;
  let getPrivate = false;

  if (req.params.status === "edit") {
    if (req.session.user) {
      userId = req.session.user._id;
      getPrivate = true;
    }
    else {
      return res.json({ code: 401 });
    }
  }
  else {
    try {
      const user = await User.findById(req.body.id);

      if (user) {
        userId = user._id.toString();

        if (req.session.user) {
          getPrivate = req.session.user._id === userId;
        }
      }
      else {
        return res.json({ code: 404, message: "User not found." });
      }
    } catch (e) {
      console.log(e);
      return res.json({ code: 500 });
    }
  }
  sendSnippet(res, req.params.snippetId, userId, getPrivate);
});

async function sendSnippet(res, snippetId, userId, getPrivate) {
  const isPrivateValues = [false];

  if (getPrivate) {
    isPrivateValues.push(true);
  }

  try {
    const snippet = await Snippet.findOne({ $and: [{ id: snippetId }, { userId }, { isPrivate: {$in: isPrivateValues }}]});

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