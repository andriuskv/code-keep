const express = require("express");
const fetch = require("node-fetch");
const uuidv4 = require("uuid/v4");
const Snippet = require("../models/Snippet");
const User = require("../models/User");
const fileInfo = require("../src/file-info.json");
const router = express.Router();

async function fetchGists(userId) {
  try {
    const user = await User.findById(userId);

    if (!user) {
      return { code: 500 };
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
    return { code: 500 };
  } catch (e) {
    console.log(e);
    return { code: 500 };
  }
}

router.get("/:userId", async (req, res) => {
  const isPrivateValues = [false];
  let getPrivate = false;

  if (req.session.user) {
    getPrivate = req.session.user._id === req.params.userId;

    if (getPrivate) {
      isPrivateValues.push(getPrivate);
    }
  }

  try {
    const data = {
      snippets: []
    };
    const [gists, snippets] = await Promise.all([
      getPrivate ? fetchGists(req.params.userId) : [],
      Snippet.find({ $and: [{ userId: req.params.userId }, { isPrivate: { $in: isPrivateValues }}]})
    ]);

    if (Array.isArray(gists)) {
      data.snippets = data.snippets.concat(gists.map(parseGist));
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
    if (req.body.isGist) {
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
        return { code: 500 };
      }
      const data = await fetch(`https://api.github.com/gists/${req.body.id}`, {
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
        return res.json({ code: 500, message: data.message });
      }
      return res.json({ code: 200 });
    }
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

  if (req.query.type === "gist" && req.session.user && req.session.user._id === req.body.id) {
    const user = await User.findById(req.body.id);

    if (!user) {
      return res.json({ code: 404, message: "User not found." });
    }
    if (!user.accessToken) {
      return res.json({ code: 404, message: "Snippet not found." });
    }
    const data = await fetch(`https://api.github.com/gists/${req.params.snippetId}`, {
      method: "GET",
      headers: {
        "Authorization": `token ${user.accessToken}`
      }
    }).then(res => res.json());

    if (data.message === "Not Found") {
      res.json({ code: 404, message: "Snippet not found." });
    }
    else {
      res.json(parseGist(data));
    }
  }
  else {
    sendSnippet(res, req.params.snippetId, userId, getPrivate);
  }
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

function parseGist(gist) {
  return {
    id: gist.id,
    created: gist.created_at,
    title: getGistTitle(gist.id, gist.files),
    description: gist.description,
    isGist: true,
    url: gist.html_url,
    files: Object.keys(gist.files).map(key => {
      const file = gist.files[key];
      const type = !file.language || file.language === "Text" ? "default": file.language.toLowerCase();

      return {
        name: file.filename,
        initialName: file.filename,
        id: uuidv4(),
        value: file.content,
        ...fileInfo[type]
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
