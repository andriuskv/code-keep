const User = require("../models/User");
const mongoose = require("mongoose");
const { ObjectID } = require("mongodb");
const multer = require("multer");
const GridFsStorage = require("multer-gridfs-storage");
let gfs = null;
let upload = null;

mongoose.connection.once("open", async () => {
  const storage = new GridFsStorage({
    db: mongoose.connection.db,
    file(req, file) {
      let ext = "";

      if (file.originalname.split(".").length > 1) {
        ext = file.originalname.substring(file.originalname.lastIndexOf("."), file.originalname.length);
      }
      return {
        filename: Date.now() + ext,
        bucketName: "profile_images"
      };
    }
  });

  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "profile_images"
  });

  upload = multer({ storage, fileFilter, limits: {
    fileSize: 32768
  }}).single("profile_image");

  function fileFilter(req, file, cb) {
    cb(null, file.mimetype.startsWith("image"));
  }
});

function uploadImage(req, res) {
  if (!req.session.user) {
    return res.sendStatus(401);
  }
  upload(req, res, async err => {
    try {
      if (err instanceof multer.MulterError) {
        console.log(err);

        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ message: "File is too large." });
        }
        return res.sendStatus(400);
      }
      else if (err) {
        console.log(err);
        return res.sendStatus(500);
      }
      const user = await User.findUser(req.session.user.username);

      if (user) {
        deleteImage(user.profileImage);
        user.profileImage = {
          id: req.file.id.toString(),
          path: `/users/image/${req.file.filename}`,
          name: req.file.filename
        };
        await user.save();
        const data = user.getUserSession();
        req.session.user = data;
        return res.json(data);
      }
      res.sendStatus(500);
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  });
}

async function fetchImage(req, res) {
  const stream = gfs.openDownloadStreamByName(req.params.filename);

  stream.on("error", err => {
    if (err.code === "ENOENT") {
      return res.sendStatus(404);
    }
    res.sendStatus(500);
  });
  stream.pipe(res);
}

function deleteImage(image) {
  if (!image || !image.id) {
    return;
  }
  gfs.delete(new ObjectID(image.id)).catch(e => {
    console.log(e);
  });
}

module.exports = {
  uploadImage,
  fetchImage,
  deleteImage
};
