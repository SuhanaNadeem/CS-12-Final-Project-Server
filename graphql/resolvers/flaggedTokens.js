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

      var userTokens = transcription.toLowerCase();

      var detected = "start";
      if (
        targetUser.stopKey &&
        targetUser.stopKey != "" &&
        userTokens.includes(targetUser.stopKey)
      ) {
        detected = "stop";
      } else if (
        targetUser.panicKey &&
        targetUser.panicKey != "" &&
        userTokens.includes(targetUser.panicKey)
      ) {
        detected = "panic";
      }

      return detected;
    },

    async createPoliceTokens(_, { tokens }, context) {
      console.log("createPoliceTokens entered");
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      if (!tokens || tokens === "") {
        throw new UserInputError("Invalid input");
      }
      tokens = tokens.toLowerCase();
      var tokenArray = tokens.split("&");
      for (var t of tokenArray) {
        console.log(t);
        const newPoliceToken = new FlaggedToken({
          name: "Police",
          token: t,
        });
        const res = await newPoliceToken.save();
      }

      return tokenArray;
    },

    async createThiefTokens(_, { tokens }, context) {
      console.log("createThiefTokens entered");
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new AuthenticationError(error);
      }
      if (!tokens || tokens === "") {
        throw new UserInputError("Invalid input");
      }
      tokens = tokens.toLowerCase();
      var tokenArray = tokens.split("&");
      for (var t of tokenArray) {
        console.log(t);
        const newThiefToken = new FlaggedToken({
          name: "Thief",
          token: t,
        });
        const res = await newThiefToken.save();
      }

      return tokenArray;
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
      var userTokens = transcription.toLowerCase();
      const policeTokens = await FlaggedToken.find({ name: "Police" });
      const thiefTokens = await FlaggedToken.find({ name: "Thief" });

      var detected = "stop";
      if (
        targetUser.startKey &&
        targetUser.startKey != "" &&
        userTokens.includes(targetUser.startKey)
      ) {
        detected = "start";
      } else if (policeTokens) {
        for (var policeToken of policeTokens) {
          console.log(policeToken);
          if (userTokens.includes(policeToken.token)) {
            detected = "start";
            break;
          }
        }
      } else if (thiefTokens) {
        for (var thiefToken of thiefTokens) {
          console.log(thiefToken);
          if (userTokens.includes(thiefToken.token)) {
            detected = "start";
            break;
          }
        }
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
