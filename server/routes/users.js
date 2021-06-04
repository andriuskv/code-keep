const express = require("express");
const validator = require("validator");
const fetch = require("node-fetch");
const User = require("../models/User");
const Snippet = require("../models/Snippet");
const { uploadImage, deleteImage } = require("./users.profile-image");
const { getStore } = require("../session");
const { loginAttemptLimiter } = require("../middleware/rateLimiter.js");
const reservedUsernames = require("../data/reserved_usernames.json");
const router = express.Router();

router.post("/", async (req, res) => {
  const fieldsValid = validateFields(["username", "email", "password", "repeatedPassword"], req.body);

  if (!fieldsValid) {
    return res.sendStatus(400);
  }

  if (!validator.isAlphanumeric(req.body.username)) {
    return res.status(400).json({ message: "Username can only contain alphanumeric characters.", field: "username" });
  }

  if (!validator.isLength(req.body.username, { min: 3, max: 20 })) {
    return res.status(400).json({ message: "Username length should be between 3 and 20 characters.", field: "username" });
  }

  if (!validator.isEmail(req.body.email)) {
    return res.status(400).json({ message: "Invalid email.", field: "email" });
  }

  if (!validator.isLength(req.body.password, { min: 6, max: 254 })) {
    return res.status(400).json({ message: "Password must be at least 6 characters.", field: "password" });
  }

  if (req.body.password !== req.body.repeatedPassword) {
    return res.status(400).json({ message: "Passwords don't match.", field: "password" });
  }

  if (reservedUsernames.includes(req.body.username.toLowerCase())) {
    return res.status(400).json({ message: "User with that username or email already exists.", field: "form" });
  }

  try {
    const existingUser = await User.findOne({ $or: [
      { email: req.body.email },
      { usernameLowerCase: { $regex: new RegExp(`^${req.body.username.toLowerCase()}$`, "i") } }
    ]});

    if (existingUser) {
      return res.status(400).json({ message: "User with that username or email already exists.", field: "form" });
    }
    const user = new User({
      username: req.body.username,
      usernameLowerCase: req.body.username.toLowerCase(),
      email: req.body.email.toLowerCase()
    });
    const data = user.getUserSession();
    user.setPassword(req.body.password);
    await user.save();

    req.session.user = data;
    res.json(data);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post("/login", loginAttemptLimiter, async (req, res) => {
  const fieldsValid = validateFields(["username", "password"], req.body);

  if (!fieldsValid) {
    return res.sendStatus(400);
  }

  if (!validator.isLength(req.body.username, { min: 3, max: 20 })) {
    return res.sendStatus(400);
  }

  if (!validator.isLength(req.body.password, { min: 6, max: 254 })) {
    return res.sendStatus(400);
  }

  try {
    const user = await User.findUser(req.body.username);

    if (user && user.validatePassword(req.body.password)) {
      const data = user.getUserSession();
      req.session.user = data;
      return res.json(data);
    }
    return res.sendStatus(400);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.get("/logout", (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(204);
  }
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      res.sendStatus(500);
    }
    else {
      res.clearCookie("sid");
      res.sendStatus(204);
    }
  });
});

router.get("/me", async ({ session: { user }}, res) => {
  if (user) {
    res.json(user);
  }
  else {
    res.sendStatus(204);
  }
});

router.get("/me/github", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  try {
    const user = await User.findUser(req.session.user.username);

    if (!user) {
      return res.sendStatus(500);
    }
    const data = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        "Authorization": `token ${user.accessToken}`
      }
    }).then(res => res.json());

    if (data.message) {
      return res.sendStatus(500);
    }
    else {
      // Use github profile image if user doesn't have it set.
      if (!user.profileImage.path) {
        user.profileImage.path = data.avatar_url;
        await user.save();
        req.session.user = user.getUserSession();
      }
      res.json({
        name: data.name,
        username: data.login,
        profileImage: data.avatar_url,
        url: data.html_url
      });
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.get("/disconnect", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(204);
  }
  try {
    const user = await User.findUser(req.session.user.username);

    if (user) {
      user.accessToken = undefined;
      await user.save();
      req.session.user = user.getUserSession();
      return res.sendStatus(204);
    }
    res.sendStatus(500);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.get("/connect/github", async (req, res) => {
  if (!req.session.user) {
    return res.redirect(`${process.env.APP_URL}/settings?status=500`);
  }
  const params = `scope=read:user,gist&client_id=${process.env.CLIENT_ID}&state=${req.session.id}`;

  try {
    res.redirect(`https://github.com/login/oauth/authorize?${params}`);
  } catch (e) {
    console.log(e);
    res.redirect(`${process.env.APP_URL}/settings?status=500`);
  }
});

router.get("/connect/github/redirect", async (req, res) => {
  const errorUrl = `${process.env.APP_URL}/settings?status=500`;

  try {
    if (req.query.code && req.query.state) {
      const clientId = process.env.CLIENT_ID;
      const clientSecret = process.env.CLIENT_SECRET;
      const params = `client_id=${clientId}&client_secret=${clientSecret}&code=${req.query.code}&state=${req.query.state}`;
      const data = await fetch(`https://github.com/login/oauth/access_token?${params}`, {
        method: "POST",
        headers: {
          "Accept": "application/json"
        }
      }).then(res => res.json());

      if (data.access_token) {
        const store = getStore();

        store.get(req.query.state, async (err, session) => {
          if (err || !session) {
            console.log(err);
            return res.redirect(errorUrl);
          }
          const user = await User.findUser(session.user.username);

          if (user) {
            user.accessToken = data.access_token;
            await user.save();
            req.session.user = user.getUserSession();
            res.redirect(`${process.env.APP_URL}/settings`);
          }
          else {
            res.redirect(errorUrl);
          }
        });
        return;
      }
    }
    res.redirect(errorUrl);
  } catch (e) {
    console.log(e);
    res.redirect(errorUrl);
  }
});

router.get("/:username", async (req, res) => {
  try {
    const user = await User.findUser(req.params.username);

    if (user && (user.role !== "admin" || req.session.user?.role === "admin")) {
      return res.json(user.getUser());
    }
    res.sendStatus(404);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post("/:username/image", uploadImage);

router.patch("/:username", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }

  if (validateFields(["oldUsername", "newUsername"], req.body)) {
    changeUsername(req, res);
  }
  else if (validateFields(["currentPassword", "newPassword", "repeatedNewPassword"], req.body)) {
    changePassword(req, res);
  }
  else {
    res.sendStatus(400);
  }
});

router.delete("/:username", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  try {
    const user = await User.findById(req.session.user._id);

    if (user && user.username === req.session.user.username) {
      deleteImage(user.profileImage);
      await user.remove();
      await Snippet.deleteMany({ userId: req.session.user._id });

      req.session.destroy(err => {
        if (err) {
          console.log(err);
          res.sendStatus(500);
        }
        else {
          res.clearCookie("sid");
          res.sendStatus(204);
        }
      });
    }
    else {
      res.sendStatus(404);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

router.post("/:username/favorites", async (req, res) => {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  try {
    const user = await User.findUser(req.params.username);

    if (user) {
      if (req.body.userId === user._id.toString()) {
        return res.status(400).json({ message: "Can't favorite your own snippet." });
      }
      const snippet = await Snippet.findOne({ $and: [{ id: req.body.snippetId }, { userId: req.body.userId } ]});
      const index = user.favorites.findIndex(fav => {
        return fav.snippetId === req.body.snippetId && fav.userId === req.body.userId;
      });

      if (!snippet) {
        if (index >= 0) {
          user.favorites.splice(index, 1);
          await user.save();
        }
        res.sendStatus(204);
        return;
      }

      if (index >= 0) {
        if (!req.body.type) {
          res.sendStatus(400);
        }
        else if (req.body.type === "favorite") {
          user.favorites.splice(index, 1);
          await user.save();
          res.json({
            snippet: {
              type: snippet.type,
              id: snippet.id
            }
          });
        }
        else {
          res.sendStatus(201);
        }
      }
      else {
        delete req.body.type;
        user.favorites.push(req.body);
        await user.save();
        res.sendStatus(201);
      }
    }
    else {
      res.sendStatus(404);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

async function changeUsername(req, res) {
  if (!validator.isAlphanumeric(req.body.newUsername)) {
    return res.status(400).json({ message: "Username can only contain alphanumeric characters." });
  }

  if (!validator.isLength(req.body.newUsername, { min: 3, max: 20 })) {
    return res.status(400).json({ message: "Username length should be between 3 and 20 characters." });
  }

  if (req.body.newUsername === req.body.oldUsername) {
    return res.status(400).json({ message: "Can't change to the same username." });
  }

  try {
    const user = await User.findUser(req.body.oldUsername);

    if (user && user.username === req.session.user.username) {
      const userWithNewName = await User.findUser(req.body.newUsername);

      if (userWithNewName && user.username !== userWithNewName.username) {
        return res.status(400).json({ message: "User with that username already exists." });
      }
      user.username = req.body.newUsername;
      user.usernameLowerCase = req.body.newUsername.toLowerCase();

      await user.save();
      req.session.user = user.getUserSession();
      return res.sendStatus(204);
    }
    res.sendStatus(400);
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
}

async function changePassword(req, res) {
  if (!validator.isLength(req.body.newPassword, { min: 6, max: 254 }) ||
    !validator.isLength(req.body.repeatedNewPassword, { min: 6, max: 254 })
  ) {
    return res.status(400).json({ message: "New password must be at least 6 characters.", field: "newPassword" });
  }
  if (req.body.newPassword !== req.body.repeatedNewPassword) {
    return res.status(400).json({ message: "Passwords don't match.", field: "newPassword" });
  }
  if (req.body.currentPassword === req.body.newPassword) {
    return res.status(400).json({ message: "New and old passwords cannot be the same.", field: "newPassword" });
  }
  try {
    const user = await User.findById(req.session.user._id);

    if (user) {
      if (!user.validatePassword(req.body.currentPassword)) {
        return res.status(400).json({ message: "Incorrect password.", field: "currentPassword" });
      }
      user.setPassword(req.body.newPassword);
      await user.save();
      return res.sendStatus(204);
    }
    else {
      res.sendStatus(500);
    }
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
}

function validateFields(requiredFields, presentFields) {
  for (const field of requiredFields) {
    if (!presentFields[field]) {
      return false;
    }
  }
  return true;
}

module.exports = router;
