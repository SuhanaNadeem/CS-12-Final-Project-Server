const { UserInputError, AuthenticationError } = require("apollo-server");

const User = require("../../models/User");
const checkUserAuth = require("../../util/checkUserAuth");
const FlaggedToken = require("../../models/FlaggedToken");

sw = require("stopword");

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
      const startKey = targetUser.startKey.toLowerCase();

      var detected = "stop";

      var modifiedToken;
      const modifiedTranscription = sw.removeStopwords(
        transcription.split(" ")
      );
      var count;

      console.log("modified transcription: " + modifiedTranscription);
      console.log(thiefTokens);
      if (startKey && startKey != "" && transcription.includes(startKey)) {
        detected = "start";
      }
      // TODO check out the changes I made here for if the phrase doesn't match directly...
      // if there are enough common (unique) words between a particular token and the transcription, then we also return "start"
      // Need to test this more, and make sure it doesn't cause too many false positives

      if (policeTokens && detected === "stop") {
        for (var policeToken of policeTokens) {
          if (transcription.includes(policeToken.token)) {
            console.log("entering here 4");

            detected = "start";
            break;
          } else {
            count = 0;
            modifiedToken = sw.removeStopwords(policeToken.token.split(" "));
            // take the current policeToken.token and remove all its common words, and create an array of the unique words left
            // take the transcription and remove all its common words
            // See if any word from the policeToken.token is included in the transcription

            console.log("modified police token: " + modifiedToken);
            for (var word of modifiedToken) {
              if (transcription.includes(word)) {
                console.log(
                  "~~~~~~~~~~~~~~~~~~~~~entered~~~~~~~~~~~~~~~~~~~~~~~~"
                );

                // console.log(word);
                count += 1;
              }
            }
            if (count > modifiedToken.length / 2) {
              console.log("entering here 3");

              detected = "start";
              break;
            }
          }
        }
      }
      if (thiefTokens && detected === "stop") {
        console.log("enters thief check");
        for (var thiefToken of thiefTokens) {
          if (transcription.includes(thiefToken.token)) {
            console.log("entering here 1");
            console.log(thiefToken.token);
            detected = "start";
            break;
          } else {
            count = 0;
            modifiedToken = sw.removeStopwords(thiefToken.token.split(" "));

            console.log("modified thief token: " + modifiedToken);
            for (var word of modifiedToken) {
              if (transcription.includes(word)) {
                console.log(
                  "~~~~~~~~~~~~~~~~~~~~~entered~~~~~~~~~~~~~~~~~~~~~~~~"
                );

                // console.log(word);
                count += 1;
              }
            }
            console.log("Count is " + count);
            if (count > modifiedToken.length / 2) {
              console.log("entering here 2");
              detected = "start";
              break;
            }
          }
        }
      }
      // else if (
      //   transcription.includes("f***") ||
      //   transcription.includes("s***") ||
      //   transcription.includes("b*****")
      // ) {
      //   // TODO Add more profane words above and organize in an env
      //   detected = "start";
      // }

      return detected;
    },
  },
};
