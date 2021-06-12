const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const checkUserAuth = require("../../util/checkUserAuth");

module.exports = {
  Query: {},
  Mutation: {
    async matchTranscription(_, { transcription, userId }, context) {
      console.log("matchTranscription");

      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }

      return true;
    },
  },
};
