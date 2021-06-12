const { model, Schema } = require("mongoose");
const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 10);

const flaggedTokensSchema = new Schema({
  _id: {
    type: String,
    default: () => nanoid(),
  },
  policePhrases: [String],
  thiefPhrases: [String],
  createdAt: Date,
});

module.exports = model("FlaggedTokens", flaggedTokensSchema);
