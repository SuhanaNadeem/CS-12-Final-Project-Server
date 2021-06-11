const { model, Schema } = require("mongoose");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

const flaggedPhrasesSchema = new Schema({
  _id: {
    type: String,
    default: () => nanoid(),
  },
  policePhrases: [String],
  thiefPhrases: [String],
  createdAt: Date,
});

module.exports = model("FlaggedPhrases", flaggedPhrasesSchema);
