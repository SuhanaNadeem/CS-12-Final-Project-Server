const { model, Schema } = require("mongoose");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

const transcriptionSchema = new Schema({
  _id: {
    type: String,
    default: () => nanoid(),
  },
  userId: String,
  latestTranscription: String,
  createdAt: Date,
});

module.exports = model("Transcription", transcriptionSchema);
