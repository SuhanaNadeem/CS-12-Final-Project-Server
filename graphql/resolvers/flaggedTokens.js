const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const checkUserAuth = require("../../util/checkUserAuth");
const FlaggedToken = require("../../models/FlaggedToken");

module.exports = {
  Query: {
    async getPoliceTokens(_, {}, context) {
      console.log("Entered getPoliceTokens");
      const policeTokens = await FlaggedToken.find({ name: "Police" });
      var stringTokens = [];
      for (var token of policeTokens) {
        stringTokens.push(token.token);
      }
      console.log(stringTokens);
      return stringTokens;
    },

    async getThiefTokens(_, {}, context) {
      console.log("Entered getThiefTokens");
      const thiefTokens = await FlaggedToken.find({ name: "Thief" });
      var stringTokens = [];
      for (var token of thiefTokens) {
        stringTokens.push(token.token);
      }
      console.log(stringTokens);
      return stringTokens;
    },
  },
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

    async deletePoliceTokens(_, { tokens }, context) {
      const tokensToRemove = tokens.split("&");
      const policeTokens = await FlaggedToken.find({ name: "Police" });

      var tokenRemoved = false;
      for (var token of policeTokens) {
        for (var removeToken of tokensToRemove) {
          if (token.token === removeToken) {
            await token.delete();
            tokenRemoved = true;
            // Keep looping to remove all occurences of token
          }
          else if (removeToken === "*") { // Clear all Police tokens (dangerous)
            await token.delete();
            tokenRemoved = true;
          }
        }
      }

      return tokenRemoved;
    },

    async deleteThiefTokens(_, { tokens }, context) {
      const tokensToRemove = tokens.split("&");
      const thiefTokens = await FlaggedToken.find({ name: "Thief" });

      var tokenRemoved = false;
      for (var token of thiefTokens) {
        for (var removeToken of tokensToRemove) {
          if (token.token === removeToken) {
            await token.delete();
            tokenRemoved = true;
            // Keep looping to remove all occurences of token
          }
          else if (removeToken === "*") { // Clear all Police tokens (dangerous)
            await token.delete();
            tokenRemoved = true;
          }
        }
      }

    return tokenRemoved;
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
