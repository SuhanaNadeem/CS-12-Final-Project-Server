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
  s3RecordingUrls: [String],
  createdAt: Date,
  startKey: String,
  panicKey: String,
  stopKey: String,
  eventRecordingStatus: Boolean,
});

module.exports = model("User", userSchema);
