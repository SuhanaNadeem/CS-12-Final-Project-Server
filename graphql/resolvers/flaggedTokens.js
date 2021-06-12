const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const checkUserAuth = require("../../util/checkUserAuth");
const FlaggedToken = require("../../models/FlaggedToken");

module.exports = {
  Query: {},
  Mutation: {
    async matchTranscription(_, { transcription, userId }, context) {
      console.log("matchTranscription entered");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }
      // TODO do the matching to figure out whether to start the event recording
      var userTokens = transcription.split(" ");

      userTokens = userTokens.filter((a) => a !== "is");
      userTokens = userTokens.filter((a) => a !== "as");
      userTokens = userTokens.filter((a) => a !== "this");
      userTokens = userTokens.filter((a) => a !== "that");
      userTokens = userTokens.filter((a) => a !== "the");
      userTokens = userTokens.filter((a) => a !== "a");

      // Get array of all tokens of a police and thief
      const policeTokens = await FlaggedToken.find({ name: "Police" });
      const thiefTokens = await FlaggedToken.find({ name: "Thief" });

      if (targetUser.startKey && targetUser.startKey != "") {
        // TODO match userTokens to startKey
      } else if (policeTokens) {
        // TODO match userTokens to policeTokens
      } else if (thiefTokens) {
        // TODO match userTokens to thiefTokens
      }

      return true; // temporary; return true if event was detected, false otherwise
    },
  },
};
