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

      transcription = transcription.toLowerCase();

      var detected = "start";
      if (stopKey && stopKey != "" && transcription.includes(stopKey)) {
        detected = "stop";
      } else if (
        panicKey &&
        panicKey != "" &&
        transcription.includes(panicKey)
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
      var targetToken;
      var addedTokens = [];
      for (var t of tokenArray) {
        targetToken = await FlaggedToken.find({ token: t });
        // <1 of the specified token(s) already exist(s)?

        if (!targetToken || targetToken.length === 0) {
          addedTokens.push(t);
          console.log(t);
          const newPoliceToken = new FlaggedToken({
            name: "Police",
            token: t,
          });
          await newPoliceToken.save();
        }
      }

      return addedTokens;
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
      var targetToken;
      var addedTokens = [];
      for (var t of tokenArray) {
        targetToken = await FlaggedToken.find({ token: t });
        // <1 of the specified token(s) already exist(s)?

        if (!targetToken || targetToken.length === 0) {
          addedTokens.push(t);

          const newThiefToken = new FlaggedToken({
            name: "Thief",
            token: t,
          });
          await newThiefToken.save();
        }
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
      transcription = transcription.toLowerCase();
      const policeTokens = await FlaggedToken.find({ name: "Police" });
      const thiefTokens = await FlaggedToken.find({ name: "Thief" });
      console.log(targetUser.startKey);
      const startKey = targetUser.startKey.toLowerCase();

      var detected = "stop";
      var count = 0;
      if (startKey && startKey != "" && transcription.includes(startKey)) {
        console.log("enters the start key check");
        detected = "start";
      } else if (policeTokens) {
        for (var policeToken of policeTokens) {
          console.log(policeToken);
          if (transcription.includes(policeToken.token)) {
            detected = "start";
            break;
          }
          // else if {
          //   for(var policeTokenWord of policeToken.split(" ")){

          //     if (transcription.includes(policeTokenWord)){
          //       count += 1
          //     }
          //   }
          //   if(count >)
          // }
        }
      } else if (thiefTokens) {
        for (var thiefToken of thiefTokens) {
          console.log(thiefToken);
          if (transcription.includes(thiefToken.token)) {
            detected = "start";
            break;
          }
        }
      } else if (
        transcription.includes("f***") ||
        transcription.includes("s***") ||
        transcription.includes("b*****")
      ) {
        // Add more profane words above?
        detected = "start";
      }

      return detected;
    },
  },
};
