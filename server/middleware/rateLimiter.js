const rateLimit = require("express-rate-limit");

const loginAttemptLimter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, please try again in 5 minutes." },
  headers: false
});

module.exports = {
  loginAttemptLimter
};
