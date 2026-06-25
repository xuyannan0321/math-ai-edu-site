const multer = require("multer");
const { env } = require("../config/env");
const { createHttpError } = require("../utils/response");

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.upload.maxImageSizeBytes,
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      callback(createHttpError(400, "请上传 jpg、png 或 webp 格式的题目图片。"));
      return;
    }

    callback(null, true);
  },
});

function uploadProblemImage(req, res, next) {
  imageUpload.single("image")(req, res, (error) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return next(createHttpError(413, `图片大小不能超过 ${env.upload.maxImageSizeMb}MB。`));
      }

      return next(error);
    }

    if (!req.file) {
      return next(createHttpError(400, "请先上传题目图片。"));
    }

    return next();
  });
}

module.exports = {
  ALLOWED_IMAGE_TYPES,
  uploadProblemImage,
};
