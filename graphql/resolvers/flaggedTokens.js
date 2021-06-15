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
      
      var userTokens = transcription.toLowerCase();

      // userTokens = userTokens.filter((a) => a !== "is");
      // userTokens = userTokens.filter((a) => a !== "as");
      // userTokens = userTokens.filter((a) => a !== "this");
      // userTokens = userTokens.filter((a) => a !== "that");
      // userTokens = userTokens.filter((a) => a !== "the");
      // userTokens = userTokens.filter((a) => a !== "a");

      // Get array of all tokens of a police and thief
      const policeTokens = await FlaggedToken.find({ name: "Police" });
      const thiefTokens = await FlaggedToken.find({ name: "Thief" });
      console.log(thiefTokens);

      if (targetUser.startKey && targetUser.startKey != "" && userTokens.includes(targetUser.startKey)) {
        return true;
      }
      if (policeTokens) {
        for (var policeToken of policeTokens) {
          console.log(policeToken);
          if (userTokens.includes(policeToken.token)) {
            return true;
          }
        }
      }
      if (thiefTokens) {
        for (var thiefToken of thiefTokens) {
          console.log(thiefToken);
          if (userTokens.includes(thiefToken.token)) {
            return true;
          }
        }
      }

      return false;
    },

    async createPoliceTokens(_, { tokens }, context) {
      console.log("createPoliceTokens entered");
      var tokenArray = tokens.split("&");
      for (var t of tokenArray) {
        console.log(t);
        const newPoliceToken = new FlaggedToken({
          name: "Police",
          token: t
        });
        const res = await newPoliceToken.save();
      }

      return tokenArray;
    },

    async createThiefTokens(_, { tokens }, context) {
      console.log("createThiefTokens entered");
      var tokenArray = tokens.split("&");
      for (var t of tokenArray) {
        console.log(t);
        const newThiefToken = new FlaggedToken({
          name: "Thief",
          token: t
        });
        const res = await newThiefToken.save();
      }

      return tokenArray;
    },
  },
};
