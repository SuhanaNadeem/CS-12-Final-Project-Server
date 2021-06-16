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
      const stopKey = targetUser.stopKey.toLowerCase();
      const panicKey = targetUser.panicKey.toLowerCase();

      var userTokens = transcription.toLowerCase();

      var detected = "start";
      if (stopKey && stopKey != "" && userTokens.includes(stopKey)) {
        detected = "stop";
      } else if (panicKey && panicKey != "" && userTokens.includes(panicKey)) {
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
      console.log(targetUser.startKey);
      const startKey = targetUser.startKey.toLowerCase();

      var detected = "stop";
      if (startKey && startKey != "" && userTokens.includes(startKey)) {
        console.log("enters the start key check");
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
