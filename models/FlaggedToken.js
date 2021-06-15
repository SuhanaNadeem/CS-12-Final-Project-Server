const { model, Schema } = require("mongoose");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

const flaggedTokenSchema = new Schema({
  _id: {
    type: String,
    default: () => nanoid(),
  },
  name: String,
  token: String,
  createdAt: Date,
});

module.exports = model("FlaggedToken", flaggedTokenSchema);