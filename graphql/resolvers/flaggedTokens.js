const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const checkUserAuth = require("../../util/checkUserAuth");
const FlaggedToken = require("../../models/FlaggedToken");
const userResolvers = require("./users");

sw = require("stopword");

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

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

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
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
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
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
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
          } else if (removeToken === "*") {
            // Clear all Police tokens (dangerous)
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
          } else if (removeToken === "*") {
            // Clear all Police tokens (dangerous)
            await token.delete();
            tokenRemoved = true;
          }
        }
      }

      return tokenRemoved;
    },

    async matchToTokens(_, { detected, transcription, name }, context) {
      const tokens = await FlaggedToken.find({ name });

      // var count;
      // var modifiedToken;

      if (tokens && detected === "stop") {
        for (var currentToken of tokens) {
          if (transcription.includes(currentToken.token)) {
            detected = "start";
            break;
          }
          /* // TODO uncomment the following to allow matching to stopwords, if keys don't directly match 
          else {

            count = 0;
            modifiedToken = sw.removeStopwords(currentToken.token.split(" "));
            
            // Take the current policeToken.token and remove all its common words, and create an array of the unique words left
            // take the transcription and remove all its common words
            // See if any word from the policeToken.token is included in the transcription

            for (var word of modifiedToken) {
              if (transcription.includes(word)) {
                count += 1;
              }
            }
            if (count > modifiedToken.length / 2) {
              detected = "start";
              break;
            }
          }
          */
        }
      }

      return detected;
    },

    async matchStartTranscription(_, { transcription, userId }, context) {
      console.log("matchTranscription entered");

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }
      transcription = transcription.toLowerCase();
      const startKey = targetUser.startKey.toLowerCase();

      var detected = "stop";

      if (startKey && startKey != "" && transcription.includes(startKey)) {
        detected = "start";
      }

      detected = await module.exports.Mutation.matchToTokens(
        _,
        { name: "Police", detected, transcription },
        context
      );
      detected = await module.exports.Mutation.matchToTokens(
        _,
        { name: "Thief", detected, transcription },
        context
      );

      return detected;
    },
  },
};
