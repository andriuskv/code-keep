const mongoose = require("mongoose");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  usernameLowerCase: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  profileImage: {
    id: String,
    path: String,
    name: String
  },
  accessToken: String,
  hash: String,
  salt: String
});

UserSchema.methods.getUser = function() {
  return {
    _id: this._id,
    username: this.username,
    usernameLowerCase: this.usernameLowerCase,
    profileImage: this.profileImage
  };
};

UserSchema.methods.getUserSession = function() {
  return {
    ...this.getUser(),
    email: this.email,
    isGithubConnected: !!this.accessToken
  };
};

UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString("hex");
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
};

UserSchema.methods.validatePassword = function(password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, "sha512").toString("hex");
  return this.hash === hash;
};

UserSchema.statics.findUser = function(username) {
  return this.findOne({ usernameLowerCase: { $regex: new RegExp(`^${username.toLowerCase()}$`, "i") } });
};

module.exports = mongoose.model("User", UserSchema);
