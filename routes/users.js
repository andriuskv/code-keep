const express = require("express");
const validator = require("validator");
const User = require("../models/User");
const { userUploadRoute } = require("./users.upload");
const reservedUsernames = require("../data/reserved_usernames.json");
const router = express.Router();

router.post("/register", async (req, res) => {
  const missingFields = ValidateFields(["username", "email", "password", "repeatedPassword"], req.body);

  if (missingFields.length) {
    return res.json({ code: 400, message: `${missingFields.join()} ${missingFields.length > 1 ? "are" : "is"} required`, field: "form" });
  }

  if (!validator.isAlphanumeric(req.body.username)) {
    return res.json({ code: 400, message: "Username can only contain alphanumeric characters.", field: "username" });
  }

  if (!validator.isLength(req.body.username, { min: 3, max: 20 })) {
    return res.json({ code: 400, message: "Username length shuold be between 3 and 20 characters.", field: "username" });
  }

  if (!validator.isEmail(req.body.email)) {
    return res.json({ code: 400, message: "Invalid email.", field: "email" });
  }

  if (!validator.isLength(req.body.password, { min: 6, max: 254 })) {
    return res.json({ code: 400, message: "Password must be atleast 6 characters.", field: "password" });
  }

  if (req.body.password !== req.body.repeatedPassword) {
    return res.json({ code: 400, message: "Passwords don't match.", field: "password" });
  }

  if (reservedUsernames.includes(req.body.username.toLowerCase())) {
    return res.json({ code: 400, message: "User with that username or email already exists.", field: "form" });
  }

  try {
    const exsistingUser = await User.findOne({ $or: [
      { email: req.body.email },
      { usernameLowerCase: { $regex: new RegExp(`^${req.body.username.toLowerCase()}$`, "i") } }
    ]});

    if (exsistingUser) {
      return res.json({ code: 400, message: "User with that username or email already exists.", field: "form" });
    }
    const user = new User({
      username: req.body.username,
      usernameLowerCase: req.body.username.toLowerCase(),
      email: req.body.email
    });
    const data = user.getUser();
    user.setPassword(req.body.password);
    await user.save();

    req.session.user = data;
    res.json(data);
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
});

router.get("/logout", (req, res) => {
  if (!req.session.user) {
    return res.json({ code: 200 });
  }
  req.session.destroy(err => {
    if (err) {
      console.log(err);
      res.json({ code: 500 });
    }
    else {
      res.clearCookie("sid");
      res.json({ code: 200 });
    }
  });
});

router.get("/me", async ({ session: { user }}, res) => {
  if (user) {
    res.json(user);
  }
  else {
    res.json({ code: 401 });
  }
});

router.get("/:username", async (req, res) => {
  try {
    const user = await User.findUser(req.params.username);

    if (user) {
      return res.json(user.getUser());
    }
    res.json({ code: 404 });
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
});

router.post("/login", async (req, res) => {
  const missingFields = ValidateFields(["username", "password"], req.body);

  if (missingFields.length) {
    return res.json({ code: 400 });
  }

  if (!validator.isLength(req.body.username, { min: 3, max: 20 })) {
    return res.json({ code: 400 });
  }

  if (!validator.isLength(req.body.password, { min: 6, max: 254 })) {
    return res.json({ code: 400 });
  }

  try {
    const user = await User.findUser(req.body.username);

    if (user && user.validatePassword(req.body.password)) {
      const data = user.getUser();
      req.session.user = data;
      return res.json(data);
    }
    return res.json({ code: 400 });
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
});

router.post("/update", async (req, res) => {
  if (!req.session.user) {
    return res.json({ code: 401 });
  }
  const missingFields = ValidateFields(["oldUsername", "newUsername"], req.body);

  if (missingFields.length) {
    return res.json({ code: 400 });
  }

  if (!validator.isAlphanumeric(req.body.newUsername)) {
    return res.json({ code: 400, message: "Username can only contain alphanumeric characters." });
  }

  if (!validator.isLength(req.body.newUsername, { min: 3, max: 20 })) {
    return res.json({ code: 400, message: "Username length shuold be between 3 and 20 characters." });
  }

  if (req.body.newUsername === req.body.oldUsername) {
    return res.json({ code: 400, message: "Can't change to the same username." });
  }

  try {
    const user = await User.findUser(req.body.oldUsername);

    if (user) {
      const userWithNewName = await User.findUser(req.body.newUsername);

      if (userWithNewName && user.username !== userWithNewName.username) {
        return res.json({ code: 400, message: "User with that username already exists." });
      }
      user.username = req.body.newUsername;
      user.usernameLowerCase = req.body.newUsername.toLowerCase();

      await user.save();
      req.session.user = user.getUser();
      return res.json({ code: 200 });
    }
    return res.json({ code: 500 });
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
});

router.post("/change/password", async (req, res) => {
  if (!req.session.user) {
    return res.json({ code: 401 });
  }
  try {
    const missingFields = ValidateFields(["currentPassword", "newPassword", "repeatedNewPassword"], req.body);

    if (missingFields.length) {
      return res.json({ code: 400, message: `${missingFields.join()} ${missingFields.length > 1 ? "are" : "is"} required`, field: "form" });
    }
    const user = await User.findById(req.session.user._id);

    if (user) {
      if (!user.validatePassword(req.body.currentPassword)) {
        return res.json({ code: 400, message: "Incorrect password.", field: "currentPassword" });
      }

      if (req.body.newPassword !== req.body.repeatedNewPassword) {
        return res.json({ code: 400, message: "Passwords don't match.", field: "newPassword" });
      }

      if (req.body.currentPassword === req.body.newPassword) {
        return res.json({ code: 400, message: "New and old passwords cannot be the same.", field: "newPassword" });
      }
      user.setPassword(req.body.newPassword);
      await user.save();
      return res.json({ code: 200 });
    }
    else {
      res.json({ code: 500 });
    }
  } catch (e) {
    console.log(e);
    res.json({ code: 500 });
  }
});

router.post("/upload", userUploadRoute);

function ValidateFields(requiredFields, presentFields) {
  const missingFields = [];

  for (const field of requiredFields) {
    if (!presentFields[field]) {
      missingFields.push(field);
    }
  }

  return missingFields;
}

module.exports = router;
