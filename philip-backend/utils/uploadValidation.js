const path = require("path");

const allowedImageTypes = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
]);

exports.imageFileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const allowedExtensions = allowedImageTypes.get(file.mimetype);

  if (!allowedExtensions || !allowedExtensions.includes(extension)) {
    return callback(new Error("File harus berupa gambar JPG, PNG, atau WEBP"));
  }

  callback(null, true);
};

exports.safeImageExtension = (file) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  return extension === ".jpeg" ? ".jpg" : extension;
};
