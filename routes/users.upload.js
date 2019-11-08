const User = require("../models/User");
const { unlink, mkdir } = require("fs").promises;
const { existsSync } = require("fs");
const multer = require("multer");

const storage = multer.diskStorage({
  async destination(req, file, cb) {
    const path = "./profile_images";

    if (!existsSync(path)) {
      await mkdir(path);
    }
    cb(null, path);
  },
  filename(req, file, cb) {
    let ext = "";

    if (file.originalname.split(".").length > 1) {
      ext = file.originalname.substring(file.originalname.lastIndexOf("."), file.originalname.length);
    }
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage, fileFilter, limits: {
  fileSize: 32768
}}).single("profile_image");

function fileFilter(req, file, cb) {
  cb(null, file.mimetype.startsWith("image"));
}

function userUploadRoute(req, res) {
  if (!req.session.user) {
    return res.json({ code: 401 });
  }
  upload(req, res, async err => {
    try {
      if (err instanceof multer.MulterError) {
        console.log(err);

        if (err.code === "LIMIT_FILE_SIZE") {
          return res.json({ code: 400, message: "File is too large." });
        }
        return res.json({ code: 400 });
      }
      else if (err) {
        console.log(err);
        return res.json({ code: 500 });
      }
      const user = await User.findUser(req.session.user.username);

      if (user) {
        if (user.profileImage && existsSync(`.${user.profileImage}`)) {
          await unlink(`.${user.profileImage}`);
        }
        user.profileImage = `/${req.file.path}`;
        await user.save();
        const data = user.getUser();
        req.session.user = data;
        return res.json(data);
      }
      res.json({ code: 500 });
    } catch (e) {
      console.log(e);
      res.json({ code: 500 });
    }
  });
}

module.exports = {
  userUploadRoute
};
