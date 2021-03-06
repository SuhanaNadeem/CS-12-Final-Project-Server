const { model, Schema } = require("mongoose");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

const userSchema = new Schema({
  _id: {
    type: String,
    default: () => nanoid(),
  },
  name: String,
  password: String,
  email: String,
  createdAt: Date,
  startKey: String,
  panicKey: String,
  stopKey: String,
  friendIds: [String],
  requesterIds: [String],
  location: String,
  panicPhone: String,
  panicMessage: String,
  locationOn: Boolean,
});

module.exports = model("User", userSchema);
