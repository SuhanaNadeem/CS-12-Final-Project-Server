const { model, Schema } = require("mongoose");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

const fileSchema = new Schema({
  _id: {
    type: String,
    default: () => nanoid(),
  },
  filename: String,
  mimetype: String,
  encoding: String,
  url: String,
  createdAt: Date,
});

module.exports = model("File", fileSchema);
