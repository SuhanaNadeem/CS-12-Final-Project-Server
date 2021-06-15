const { model, Schema } = require("mongoose");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

const eventRecordingSchema = new Schema({
  _id: {
    type: String,
    default: () => nanoid(),
  },
  eventRecordingUrls: [String],
  userId: String,
  finished: Boolean,
  createdAt: Date,
});

module.exports = model("EventRecording", eventRecordingSchema);
