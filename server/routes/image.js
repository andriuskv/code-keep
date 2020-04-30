const express = require("express");
const { fetchImage } = require("./users.profile-image");
const router = express.Router();

router.get("/:filename", fetchImage);

module.exports = router;
