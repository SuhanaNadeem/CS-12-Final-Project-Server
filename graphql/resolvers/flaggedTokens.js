const { UserInputError } = require("apollo-server");
const checkUserAuth = require("../../util/checkUserAuth");

const User = require("../../models/User");
const FlaggedToken = require("../../models/FlaggedToken");

const userResolvers = require("./users");

sw = require("stopword");

module.exports = {
  Query: {
    // Get an array of all police tokens in the database in string format
    async getPoliceTokens(_, {}, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const policeTokens = await FlaggedToken.find({ name: "Police" });
      var stringTokens = [];

      // Extract actual token string from each token object
      for (var token of policeTokens) {
        stringTokens.push(token.token);
      }
      return stringTokens;
    },

    // Get an array of all thief tokens in the database in string format
    async getThiefTokens(_, {}, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      const thiefTokens = await FlaggedToken.find({ name: "Thief" });
      var stringTokens = [];
      // Extract actual token string from each token object

      for (var token of thiefTokens) {
        stringTokens.push(token.token);
      }
      return stringTokens;
    },
  },
  Mutation: {
    // Matches keywords to start recording (start key, police/thief tokens). Returns "start" if detected, otherwise maintains "stop"
    async matchStartTranscription(_, { transcription, userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }
      // Re-format for matching
      transcription = transcription.toLowerCase();
      const startKey = targetUser.startKey.toLowerCase();

      var detected = "stop"; // When this mutation is called, the state of the event recording is "stop"

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

    // Matches keywords to stop recording (stop/panic key). Returns "stop" or "panic" if detected, otherwise maintains "start"
    async matchStopTranscription(_, { transcription, userId }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);
      const targetUser = await User.findById(userId);
      if (!targetUser) {
        throw new UserInputError("Invalid user ID");
      }

      // Re-format for matching
      const stopKey = targetUser.stopKey.toLowerCase();
      const panicKey = targetUser.panicKey.toLowerCase();
      transcription = transcription.toLowerCase();

      var detected = "start"; // When this mutation is called, the state of the event recording is "stop"

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

    // Creates a flaggedToken object with name: "Police" and given token and saves it to the database
    async createPoliceTokens(_, { tokens }, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }

      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      if (!tokens || tokens === "") {
        throw new UserInputError("Invalid input");
      }

      tokens = tokens.toLowerCase();

      var tokenArray = tokens.split("&"); // Split at indicator
      var targetToken;
      var addedTokens = [];

      for (var t of tokenArray) {
        targetToken = await FlaggedToken.find({ token: t }); // Get tokens matching current

        if (!targetToken || targetToken.length === 0) {
          // <1 of the specified token(s) already exist(s)
          addedTokens.push(t);
          const newPoliceToken = new FlaggedToken({
            name: "Police",
            token: t,
          });
          await newPoliceToken.save();
        }
      }

      return addedTokens;
    },

    // Creates a flaggedToken object with name: "Thief" and given token and saves it to the database
    async createThiefTokens(_, { tokens }, context) {
      try {
        checkUserAuth(context);
      } catch (error) {
        throw new Error(error);
      }
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

      if (!tokens || tokens === "") {
        throw new UserInputError("Invalid input");
      }

      tokens = tokens.toLowerCase();

      var tokenArray = tokens.split("&"); // Split at indicator
      var targetToken;
      var addedTokens = [];

      for (var t of tokenArray) {
        targetToken = await FlaggedToken.find({ token: t }); // Get tokens matching current

        if (!targetToken || targetToken.length === 0) {
          // <1 of the specified token(s) already exist(s)
          addedTokens.push(t);

          // Add new token
          const newThiefToken = new FlaggedToken({
            name: "Thief",
            token: t,
          });
          await newThiefToken.save();
        }
      }
      return tokenArray;
    },

    // Deletes all occurences of police tokens in database that have the given tokens. Returns true if any were removed, false otherwise
    async deletePoliceTokens(_, { tokens }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

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

    // Deletes all occurences of thief tokens in database that have the given tokens. Returns true if any were removed, false otherwise
    async deleteThiefTokens(_, { tokens }, context) {
      await userResolvers.Mutation.authenticateUserByContext(_, {}, context);

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

    // Matches flaggedToken objects associated with the given name to the given transcription. Returns whether to "start" or "stop" recording
    async matchToTokens(_, { detected, transcription, name }, context) {
      const tokens = await FlaggedToken.find({ name });

      /* // TODO (1 of 2) Uncomment the following to allow matching to stopwords, if keys don't directly match
      // var count;
      // var modifiedToken; */

      if (tokens && detected === "stop") {
        for (var currentToken of tokens) {
          // Check if transcription directly matches any token
          if (transcription.includes(currentToken.token)) {
            detected = "start";
            break;
          }

          /* // TODO (2 of 2) Uncomment the following to allow matching to stopwords, if keys don't directly match 
          
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
  },
};
