const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const checkUserAuth = require("../../util/checkUserAuth");
const FlaggedToken = require("../../models/FlaggedToken");

module.exports = {
  Query: {},
  Mutation: {
    async matchStopTranscription(_, { transcription, userId }, context) {
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

      var userTokens = transcription.split(" ");

      var detected = "start";
      if (userTokens.includes("stop") || userTokens.includes("Stop")) {
        detected = "stop";
      } else if (userTokens.includes("panic") || userTokens.includes("Panic")) {
        detected = "panic";
      }

      return detected;
    },
    async matchStartTranscription(_, { transcription, userId }, context) {
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
      var userTokens = transcription.split(" ");

      var userTokens = transcription.split(" ");

      var detected = "stop";
      if (userTokens.includes("start") || userTokens.includes("Start")) {
        detected = "start";
      } else if (
        userTokens.includes("police") ||
        userTokens.includes("Police")
      ) {
        detected = "start";
      } else if (userTokens.includes("thief") || userTokens.includes("Thief")) {
        detected = "start";
      } else if (
        userTokens.includes("f***") ||
        userTokens.includes("s***") ||
        userTokens.includes("b*****")
      ) {
        // Add more profane words above?
        detected = "start";
      }

      return detected;
    },
  },
};
