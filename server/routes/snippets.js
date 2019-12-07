const express = require("express");
const fetch = require("node-fetch");
const uuidv4 = require("uuid/v4");
const Snippet = require("../models/Snippet");
const User = require("../models/User");
const router = express.Router();

router.get("/:userId", async (req, res) => {
  const types = ["remote", "forked"];
  let getPrivate = false;

  if (req.session.user) {
    getPrivate = req.session.user._id === req.params.userId;

    if (getPrivate) {
      types.push("private");
    }
  }

  try {
    const data = {
      snippets: []
    };
    const [gists, snippets] = await Promise.all([
      getPrivate ? fetchGists(req.params.userId) : [],
      Snippet.find({ $and: [{ userId: req.params.userId }, { type: { $in: types }}]})
    ]);

    if (Array.isArray(gists)) {
      data.snippets = data.snippets.concat(gists.map(gist => parseGist(gist, req.params.userId)));
    }
    else {
      data.gistError = true;
    }

    if (Array.isArray(snippets)) {
      data.snippets = data.snippets.concat(snippets);
    }
    else {
      data.snippetError = true;
    }
    res.json(data);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post("/", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  try {
    if (req.body.type === "gist") {
      const user = await User.findById(req.session.user._id);
      const gist = {
        description: req.body.description,
        files: req.body.files.reduce((files, file) => {
          files[file.name] = { content: file.value };
          return files;
        }, {})
      };
      const data = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          "Authorization": `token ${user.accessToken}`
        },
        body: JSON.stringify(gist)
      }).then(res => res.json());

      if (data.message) {
        return res.status(500).json({ message: data.message });
      }
      return res.sendStatus(201);
    }
    // If user tries to fork same snippet, ignore it.
    if (req.body.fork) {
      const snippet = await Snippet.findOne({ $and: [{ "fork.id": req.body.fork.id }, { userId: req.session.user._id }]});

      if (snippet) {
        return res.status(201).json({ id: snippet.id });
      }
      delete req.body._id;
    }
    const snippet = new Snippet({ ...req.body, userId: req.session.user._id });
    await snippet.save();

    res.sendStatus(201);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.put("/:snippetId", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  try {
    if (req.body.type === "gist") {
      const files = {};

      for (const file of req.body.files) {
        if (file.name !== file.initialName) {
          // Remove old file
          files[file.initialName] = null;
        }

        if (file.name) {
          files[file.name] = {
            filename: file.name,
            content: file.value
          };
        }
      }
      const user = await User.findById(req.session.user._id);

      if (!user) {
        return res.sendStatus(500);
      }
      const data = await fetch(`https://api.github.com/gists/${req.params.snippetId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `token ${user.accessToken}`
        },
        body: JSON.stringify({
          description: req.body.description,
          files
        })
      }).then(res => res.json());

      if (data.message) {
        return res.status(500).json({ message: data.message });
      }
      return res.sendStatus(200);
    }
    const snippet = await Snippet.findOneAndUpdate({ $and: [{ id: req.params.snippetId }, { userId: req.session.user._id }]}, req.body);

    if (snippet) {
      return res.sendStatus(200);
    }
    res.sendStatus(404);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.delete("/:snippetId", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  try {
    if (req.body.type === "gist") {
      const user = await User.findById(req.session.user._id);

      if (!user) {
        return res.sendStatus(500);
      }
      const response = await fetch(`https://api.github.com/gists/${req.params.snippetId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `token ${user.accessToken}`
        }
      });

      if (response.status !== 204) {
        return res.sendStatus(500);
      }
    }
    else {
      await Snippet.findOneAndRemove({ $and: [{ id: req.params.snippetId }, { userId: req.session.user._id }]});
    }
    res.sendStatus(204);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.get("/:username/:snippetId/:status?", async (req, res) => {
  let userId = null;
  let getPrivate = false;

  try {
    const user = await User.findUser(req.params.username);

    if (user) {
      userId = user._id.toString();

      if (req.session.user) {
        getPrivate = req.session.user._id === userId;
      }
    }
    else {
      return res.status(404).json({ message: "User not found." });
    }

    if (req.params.status === "edit") {
      if (!req.session.user) {
        return res.sendStatus(401);
      }
      else if (!getPrivate) {
        return res.sendStatus(404);
      }
    }

    if (req.query.type === "gist" && getPrivate) {
      if (!user.accessToken) {
        return res.status(404).json({ message: "Snippet not found." });
      }
      const data = await fetch(`https://api.github.com/gists/${req.params.snippetId}`, {
        method: "GET",
        headers: {
          "Authorization": `token ${user.accessToken}`
        }
      }).then(res => res.json());

      if (data.message === "Not Found") {
        res.status(404).json({ message: "Snippet not found." });
      }
      else {
        res.json(parseGist(data, userId));
      }
    }
    else {
      sendSnippet(res, req.params.snippetId, userId, getPrivate);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

async function sendSnippet(res, snippetId, userId, getPrivate) {
  const types = ["remote", "forked"];

  if (getPrivate) {
    types.push("private");
  }

  try {
    const snippet = await Snippet.findOne({ $and: [{ id: snippetId }, { userId }, { type: { $in: types }}]});

    if (snippet) {
      res.send(snippet);
    }
    else {
      res.status(404).json({ message: "Snippet not found." });
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
}

async function fetchGists(userId) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return;
    }
    else if (!user.accessToken) {
      return [];
    }
    const data = await fetch("https://api.github.com/gists", {
      method: "GET",
      headers: {
        "Authorization": `token ${user.accessToken}`
      }
    }).then(res => res.json());

    if (Array.isArray(data)) {
      return Promise.all(data.map(({ url }) => {
        return fetch(url, {
          method: "GET",
          headers: {
            "Authorization": `token ${user.accessToken}`
          }
        }).then(res => res.json());
      }));
    }
  } catch (e) {
    console.log(e);
  }
}

function parseGist(gist, userId) {
  return {
    userId,
    id: gist.id,
    created: gist.created_at,
    title: getGistTitle(gist.id, gist.files),
    description: gist.description,
    type: "gist",
    url: gist.html_url,
    files: Object.keys(gist.files).map(key => {
      const file = gist.files[key];
      const type = !file.language || file.language === "Text" ? "default": file.language.toLowerCase();

      return {
        name: file.filename,
        initialName: file.filename,
        id: uuidv4(),
        value: file.content,
        type
      };
    })
  };
}

function getGistTitle(id, files) {
  const [filename] = Object.keys(files);

  if (filename.includes("gistfile")) {
    return `gist:${id}`;
  }
  return filename;
}

module.exports = router;
