const express = require("express");
const router = express.Router();
const Snippet = require("../models/Snippet");
const User = require("../models/User");

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

router.get("/", async (req, res) => {
  let { q, type = "snippets", page } = req.query;

  if (!q) {
    return res.sendStatus(400);
  }
  try {
    page = parseInt(req.query.page, 10);
    page = Number.isNaN(page) || page < 0 ? 0 : page - 1;
    const itemsPerPage = 10;
    const offset = page * itemsPerPage;
    const [snippets, users] = await Promise.all([
      Snippet.find({ title: { $regex: new RegExp(escapeRegExp(q), "i") }, type: "remote" }),
      User.find({ usernameLowerCase: { $regex: new RegExp(escapeRegExp(q), "i") } })
    ]);
    const items = type === "users" ? users : snippets;
    const endIndex = items.length - offset;
    const startIndex = endIndex - itemsPerPage;

    if (page > 0 && endIndex <= 0) {
      return res.sendStatus(404);
    }
    // Reverse array to get most recent items.
    let pageItems = items.slice(startIndex < 0 ? 0 : startIndex, endIndex).reverse();

    if (type !== "users") {
      const snippetUsers = await Promise.all(pageItems.map(snippet => User.findById(snippet.userId)));
      pageItems = pageItems.map((snippet, index) => {
        snippet.user = snippetUsers[index].getUser();
        return snippet;
      });
    }
    else {
      pageItems = pageItems.map(user => user.getUser());
    }
    res.json({
      items: pageItems,
      itemCounts: {
        snippets: snippets.length,
        users: users.length
      },
      hasMorePages: items.length > offset + itemsPerPage
    });
  } catch (e) {
    console.log(e);
    res.sendStatus(500);
  }
});

module.exports = router;
